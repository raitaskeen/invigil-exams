import { Hono, type Context } from "hono";
import { feedbackReviewSchema, feedbackSchema, pastPaperSchema } from "@np/shared";
import type { AppEnv } from "../env";
import { audit } from "../lib/audit";
import { parseId, parseJson } from "../lib/validate";
import { requireAuth, requirePermission } from "../middleware/auth";
import { AttemptService } from "../services/attempt.service";
import { FeedbackService, PastPaperService, PasswordResetService, PracticeService, RankingService } from "../services/platform.service";

const u = (c: Context<AppEnv>) => c.get("user")!;
const db = (c: Context<AppEnv>) => c.get("db");

// ---- Feedback hub: everyone signed in can submit and see their own; admins review all ---------------------------
export const feedbackRoutes = new Hono<AppEnv>()
  .use(requireAuth)
  .post("/", async (c) => {
    const row = await new FeedbackService(db(c), u(c)).create(await parseJson(c, feedbackSchema));
    audit(c, "create", "feedback", row.id);
    return c.json(row, 201);
  })
  .get("/mine", async (c) => c.json({ items: await new FeedbackService(db(c), u(c)).mine() }))
  .get("/", requirePermission("users:manage"), async (c) =>
    c.json(await new FeedbackService(db(c), u(c)).all({ status: c.req.query("status") || undefined, category: c.req.query("category") || undefined })),
  )
  .patch("/:id{[0-9]+}", requirePermission("users:manage"), async (c) => {
    const { status, staffNote } = await parseJson(c, feedbackReviewSchema);
    const row = await new FeedbackService(db(c), u(c)).review(parseId(c), status, staffNote);
    audit(c, "review", "feedback", row.id);
    return c.json(row);
  });

// ---- Previous years' papers: everyone signed in can browse; examiners/admins upload -----------------------------
export const paperRoutes = new Hono<AppEnv>()
  .use(requireAuth)
  .get("/", async (c) => {
    const q = c.req.query();
    const year = Number(q.year);
    return c.json(
      await new PastPaperService(db(c), u(c)).list({
        q: q.q?.trim().slice(0, 100) || undefined,
        subject: q.subject || undefined,
        year: Number.isSafeInteger(year) && year > 0 ? year : undefined,
        examType: q.examType || undefined,
      }),
    );
  })
  .post("/", requirePermission("exams:manage"), async (c) => {
    const row = await new PastPaperService(db(c), u(c)).create(await parseJson(c, pastPaperSchema));
    audit(c, "create", "past_papers", row.id);
    return c.json(row, 201);
  })
  .get("/:id{[0-9]+}/file", async (c) => {
    const row = await new PastPaperService(db(c), u(c)).file(parseId(c));
    if (!row.content) {
      if (row.url) return c.redirect(row.url, 302);
      return c.json({ error: { code: "not_found", message: "This paper has no file." } }, 404);
    }
    const bytes = Uint8Array.from(atob(row.content), (ch) => ch.charCodeAt(0));
    const inline = c.req.query("download") !== "1";
    const name = (row.fileName ?? `paper-${row.id}`).replace(/[^\w.\- ]/g, "_");
    return c.body(bytes as unknown as ArrayBuffer, 200, {
      "Content-Type": row.mimeType ?? "application/octet-stream",
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${name}"`,
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
    });
  })
  .delete("/:id{[0-9]+}", requirePermission("exams:manage"), async (c) => {
    await new PastPaperService(db(c), u(c)).remove(parseId(c));
    audit(c, "delete", "past_papers", parseId(c));
    return c.body(null, 204);
  });

// ---- Practice / mock tests (sandboxed attempts - never official) ------------------------------------------------
export const practiceRoutes = new Hono<AppEnv>()
  .use(requirePermission("exams:take"))
  .get("/", async (c) => c.json({ items: await new PracticeService(db(c), u(c)).list() }))
  .post("/:id{[0-9]+}/start", async (c) => {
    const result = await new AttemptService(db(c), u(c)).start(parseId(c), true, true);
    return c.json(result, result.resumed ? 200 : 201);
  })
  .get("/attempts/:id{[0-9]+}/review", async (c) => c.json(await new PracticeService(db(c), u(c)).review(parseId(c))));

// ---- Rankings ----------------------------------------------------------------------------------------------------
/** Examiners: full table, enforced by RBAC + exam ownership. */
export const examRankingRoutes = new Hono<AppEnv>()
  .use(requirePermission("exams:manage"))
  .get("/:id{[0-9]+}/rankings", async (c) => {
    await new AttemptService(db(c), u(c)).finalizeExpired(parseId(c));
    return c.json(await new RankingService(db(c), u(c)).examRankings(parseId(c)));
  });

/** Candidates: own position only. */
export const myRankRoutes = new Hono<AppEnv>()
  .use(requireAuth)
  .get("/:id{[0-9]+}/rank", async (c) => c.json(await new RankingService(db(c), u(c)).myRank(parseId(c))));

// ---- Password recovery (admin side) --------------------------------------------------------------------------------
export const resetAdminRoutes = new Hono<AppEnv>()
  .use(requirePermission("users:manage"))
  .get("/", async (c) => c.json({ items: await new PasswordResetService(db(c)).pending() }))
  .post("/users/:id{[0-9]+}/code", async (c) => {
    const result = await new PasswordResetService(db(c)).issue(parseId(c), u(c).id);
    audit(c, "issue_reset_code", "users", parseId(c));
    return c.json(result, 201);
  });
