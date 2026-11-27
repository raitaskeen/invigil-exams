import { and, desc, eq, inArray, like, or, sql } from "drizzle-orm";
import type { FeedbackInput, PastPaperInput } from "@np/shared";
import { attempts, answers, examQuestions, exams, feedback, passwordResets, pastPapers, users } from "../db/schema";
import type { Db, SessionUser } from "../env";
import { AppError } from "../lib/errors";
import { hashPassword } from "../lib/password";
import { isAdmin, managedExam, nowIso, randomCode } from "./access";
import { UserService } from "./user.service";

const RESET_TTL_MS = 30 * 60_000;
const MAX_CODE_TRIES = 5;

async function sha256(text: string) {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// ---- Password recovery ---------------------------------------------------------------------------------------------

export class PasswordResetService {
  constructor(private readonly db: Db) {}

  /** Records a request. Never reveals whether the email exists. */
  async request(email: string) {
    const user = await new UserService(this.db).findByEmail(email);
    if (!user || !user.isActive) return;
    const open = await this.db
      .select({ id: passwordResets.id })
      .from(passwordResets)
      .where(and(eq(passwordResets.userId, user.id), eq(passwordResets.status, "requested")))
      .get();
    if (!open) await this.db.insert(passwordResets).values({ userId: user.id }).run();
  }

  /** Admin view: open requests and issued (unused) codes. */
  async pending() {
    return this.db
      .select({
        id: passwordResets.id,
        userId: passwordResets.userId,
        fullName: users.fullName,
        email: users.email,
        status: passwordResets.status,
        requestedAt: passwordResets.requestedAt,
        issuedAt: passwordResets.issuedAt,
        expiresAt: passwordResets.expiresAt,
      })
      .from(passwordResets)
      .innerJoin(users, eq(users.id, passwordResets.userId))
      .where(inArray(passwordResets.status, ["requested", "issued"]))
      .orderBy(desc(passwordResets.id))
      .limit(100);
  }

  /** Issues a fresh one-time code for a user. The plain code is returned once and only its hash is stored. */
  async issue(userId: number, adminId: number) {
    const user = await this.db.select({ id: users.id, email: users.email, isActive: users.isActive }).from(users).where(eq(users.id, userId)).get();
    if (!user) throw AppError.notFound("User");
    if (!user.isActive) throw AppError.conflict("Reactivate this account before issuing a reset code.");
    const code = randomCode(8);
    const codeHash = await sha256(code);
    const expiresAt = new Date(Date.now() + RESET_TTL_MS).toISOString();
    await this.db.update(passwordResets).set({ status: "expired" }).where(and(eq(passwordResets.userId, userId), eq(passwordResets.status, "issued"))).run();
    const open = await this.db.select({ id: passwordResets.id }).from(passwordResets).where(and(eq(passwordResets.userId, userId), eq(passwordResets.status, "requested"))).get();
    const values = { codeHash, status: "issued" as const, issuedAt: nowIso(), issuedBy: adminId, expiresAt, attempts: 0 };
    if (open) await this.db.update(passwordResets).set(values).where(eq(passwordResets.id, open.id)).run();
    else await this.db.insert(passwordResets).values({ userId, ...values }).run();
    return { code, email: user.email, expiresAt };
  }

  /** Verifies the code, sets the new password and revokes every existing session. */
  async reset(email: string, code: string, password: string) {
    const invalid = new AppError(400, "invalid_reset_code", "That reset code is invalid or has expired. Ask your administrator for a new one.", { code: "Invalid or expired code" });
    const user = await new UserService(this.db).findByEmail(email);
    if (!user || !user.isActive) throw invalid;
    const row = await this.db
      .select()
      .from(passwordResets)
      .where(and(eq(passwordResets.userId, user.id), eq(passwordResets.status, "issued")))
      .orderBy(desc(passwordResets.id))
      .get();
    if (!row || !row.codeHash || !row.expiresAt) throw invalid;
    if (Date.parse(row.expiresAt) < Date.now() || row.attempts >= MAX_CODE_TRIES) {
      await this.db.update(passwordResets).set({ status: "expired" }).where(eq(passwordResets.id, row.id)).run();
      throw invalid;
    }
    if (!safeEqual(await sha256(code.toUpperCase()), row.codeHash)) {
      await this.db.update(passwordResets).set({ attempts: row.attempts + 1 }).where(eq(passwordResets.id, row.id)).run();
      throw invalid;
    }
    const passwordHash = await hashPassword(password);
    await this.db.batch([
      this.db.update(users).set({ passwordHash, tokenVersion: user.tokenVersion + 1, updatedAt: nowIso() }).where(eq(users.id, user.id)),
      this.db.update(passwordResets).set({ status: "used", usedAt: nowIso() }).where(eq(passwordResets.id, row.id)),
    ]);
    return { userId: user.id };
  }
}

// ---- Feedback hub ----------------------------------------------------------------------------------------------------

export class FeedbackService {
  constructor(
    private readonly db: Db,
    private readonly user: SessionUser,
  ) {}

  create(input: FeedbackInput) {
    return this.db.insert(feedback).values({ ...input, userId: this.user.id }).returning().get();
  }

  mine() {
    return this.db.select().from(feedback).where(eq(feedback.userId, this.user.id)).orderBy(desc(feedback.id)).limit(100);
  }

  async all(opts: { status?: string; category?: string }) {
    const rows = await this.db
      .select({ f: feedback, fullName: users.fullName, email: users.email })
      .from(feedback)
      .innerJoin(users, eq(users.id, feedback.userId))
      .where(
        and(
          opts.status ? eq(feedback.status, opts.status as "new") : undefined,
          opts.category ? eq(feedback.category, opts.category as "ui_ux") : undefined,
        ),
      )
      .orderBy(desc(feedback.id))
      .limit(200);
    const stats = await this.db
      .select({ category: feedback.category, n: sql<number>`count(*)`, avg: sql<number>`round(avg(${feedback.rating}), 2)` })
      .from(feedback)
      .groupBy(feedback.category);
    return { items: rows.map((r) => ({ ...r.f, fullName: r.fullName, email: r.email })), stats };
  }

  async review(id: number, status: "new" | "reviewed" | "resolved", staffNote?: string | null) {
    const row = await this.db
      .update(feedback)
      .set({ status, staffNote: staffNote ?? null, reviewedBy: this.user.id, reviewedAt: nowIso() })
      .where(eq(feedback.id, id))
      .returning()
      .get();
    if (!row) throw AppError.notFound("Feedback");
    return row;
  }
}

// ---- Past papers -----------------------------------------------------------------------------------------------------

const paperColumns = {
  id: pastPapers.id,
  title: pastPapers.title,
  subject: pastPapers.subject,
  year: pastPapers.year,
  examType: pastPapers.examType,
  description: pastPapers.description,
  fileName: pastPapers.fileName,
  mimeType: pastPapers.mimeType,
  sizeBytes: pastPapers.sizeBytes,
  url: pastPapers.url,
  createdAt: pastPapers.createdAt,
  uploadedBy: pastPapers.uploadedBy,
  uploaderName: users.fullName,
};

export class PastPaperService {
  constructor(
    private readonly db: Db,
    private readonly user: SessionUser,
  ) {}

  async list(opts: { q?: string; subject?: string; year?: number; examType?: string }) {
    const where = and(
      opts.q ? or(like(pastPapers.title, `%${opts.q}%`), like(pastPapers.description, `%${opts.q}%`)) : undefined,
      opts.subject ? eq(pastPapers.subject, opts.subject) : undefined,
      opts.year ? eq(pastPapers.year, opts.year) : undefined,
      opts.examType ? eq(pastPapers.examType, opts.examType as "final") : undefined,
    );
    const [items, subjects, years] = await this.db.batch([
      this.db.select(paperColumns).from(pastPapers).innerJoin(users, eq(users.id, pastPapers.uploadedBy)).where(where).orderBy(desc(pastPapers.year), desc(pastPapers.id)).limit(200),
      this.db.selectDistinct({ v: pastPapers.subject }).from(pastPapers).orderBy(pastPapers.subject),
      this.db.selectDistinct({ v: pastPapers.year }).from(pastPapers).orderBy(desc(pastPapers.year)),
    ]);
    return { items, subjects: subjects.map((s) => s.v), years: years.map((y) => y.v) };
  }

  async create(input: PastPaperInput) {
    if (!this.user.permissions.includes("exams:manage")) throw AppError.forbidden();
    let sizeBytes: number | null = null;
    if (input.file) {
      try {
        sizeBytes = atob(input.file.base64).length;
      } catch {
        throw AppError.badRequest("The file could not be read.", { file: "The file could not be read" });
      }
    }
    return this.db
      .insert(pastPapers)
      .values({
        uploadedBy: this.user.id,
        title: input.title,
        subject: input.subject,
        year: input.year,
        examType: input.examType,
        description: input.description,
        url: input.url ?? null,
        fileName: input.file?.name ?? null,
        mimeType: input.file?.mimeType ?? null,
        sizeBytes,
        content: input.file?.base64 ?? null,
      })
      .returning({ id: pastPapers.id })
      .get();
  }

  async file(id: number) {
    const row = await this.db.select().from(pastPapers).where(eq(pastPapers.id, id)).get();
    if (!row) throw AppError.notFound("Paper");
    return row;
  }

  async remove(id: number) {
    const row = await this.file(id);
    if (!isAdmin(this.user) && row.uploadedBy !== this.user.id) throw AppError.notFound("Paper");
    await this.db.delete(pastPapers).where(eq(pastPapers.id, id)).run();
  }
}

// ---- Rankings (strict privacy) ------------------------------------------------------------------------------------

const finished = (examId: number) => and(eq(attempts.examId, examId), eq(attempts.isSandbox, false), sql`${attempts.status} != 'in_progress'`);
const pct = (score: number | null, max: number) => (max ? Math.round(((score ?? 0) / max) * 1000) / 10 : 0);

export class RankingService {
  constructor(
    private readonly db: Db,
    private readonly user: SessionUser,
  ) {}

  /** Examiner/admin only: the full ranked table for an exam they manage. */
  async examRankings(examId: number) {
    const exam = await managedExam(this.db, this.user, examId);
    const rows = await this.db
      .select({
        attemptId: attempts.id,
        candidateId: attempts.candidateId,
        fullName: users.fullName,
        email: users.email,
        score: attempts.score,
        maxScore: attempts.maxScore,
        status: attempts.status,
        submittedAt: attempts.submittedAt,
        startedAt: attempts.startedAt,
        pendingManual: attempts.pendingManual,
      })
      .from(attempts)
      .innerJoin(users, eq(users.id, attempts.candidateId))
      .where(finished(examId))
      .orderBy(desc(attempts.score), attempts.submittedAt);
    let prev: number | null = null;
    let rank = 0;
    const ranked = rows.map((r, i) => {
      const s = r.score ?? 0;
      if (prev === null || s !== prev) rank = i + 1; // standard competition ranking: ties share a position
      prev = s;
      const percent = pct(r.score, r.maxScore);
      return { ...r, rank, percent, passed: percent >= exam.passPercent, durationMinutes: r.submittedAt ? Math.max(0, Math.round((Date.parse(r.submittedAt) - Date.parse(r.startedAt)) / 60_000)) : null };
    });
    const scores = ranked.map((r) => r.percent);
    const mean = scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0;
    return {
      exam: { id: exam.id, title: exam.title, passPercent: exam.passPercent, totalMarks: exam.totalMarks, resultsPublished: exam.resultsPublished },
      summary: { candidates: ranked.length, meanPercent: mean, topPercent: scores[0] ?? 0, passed: ranked.filter((r) => r.passed).length },
      rankings: ranked,
    };
  }

  /**
   * Candidate: ONLY their own position. Other candidates are reduced to anonymous aggregates (a count per
   * 10% band and the mean) - no names, ids, emails or individual scores ever leave the server.
   */
  async myRank(attemptId: number) {
    const a = await this.db.select().from(attempts).where(eq(attempts.id, attemptId)).get();
    if (!a || a.candidateId !== this.user.id || a.isSandbox) throw AppError.notFound("Result");
    const exam = await this.db.select().from(exams).where(eq(exams.id, a.examId)).get();
    if (!exam || !exam.resultsPublished) throw AppError.notFound("Result");
    const peers = await this.db.select({ score: attempts.score, maxScore: attempts.maxScore }).from(attempts).where(finished(a.examId));
    const mine = a.score ?? 0;
    const higher = peers.filter((p) => (p.score ?? 0) > mine).length;
    const lower = peers.filter((p) => (p.score ?? 0) < mine).length;
    const total = peers.length;
    const percents = peers.map((p) => pct(p.score, p.maxScore));
    const bands = Array.from({ length: 10 }, (_, i) => ({ from: i * 10, to: i * 10 + 10, count: 0, mine: false }));
    for (const p of percents) bands[Math.min(9, Math.floor(p / 10))]!.count++;
    const myPercent = pct(a.score, a.maxScore);
    bands[Math.min(9, Math.floor(myPercent / 10))]!.mine = true;
    return {
      rank: higher + 1,
      total,
      percentile: total > 1 ? Math.round((lower / (total - 1)) * 100) : 100,
      score: a.score,
      maxScore: a.maxScore,
      percent: myPercent,
      meanPercent: percents.length ? Math.round((percents.reduce((x, y) => x + y, 0) / percents.length) * 10) / 10 : 0,
      bands: bands.map(({ from, to, count, mine: m }) => ({ from, to, count, mine: m })),
    };
  }
}

// ---- Practice / mock tests -------------------------------------------------------------------------------------------

export class PracticeService {
  constructor(
    private readonly db: Db,
    private readonly user: SessionUser,
  ) {}

  async list() {
    if (!this.user.permissions.includes("exams:take")) throw AppError.forbidden();
    const rows = await this.db
      .select({
        id: exams.id,
        title: exams.title,
        instructions: exams.instructions,
        durationMinutes: exams.durationMinutes,
        totalMarks: exams.totalMarks,
        questions: sql<number>`(select count(*) from ${examQuestions} eq where eq.exam_id = ${exams.id})`,
      })
      .from(exams)
      .where(and(eq(exams.isPractice, true), sql`${exams.status} != 'draft'`))
      .orderBy(desc(exams.id));
    const mine = rows.length
      ? await this.db
          .select({ id: attempts.id, examId: attempts.examId, status: attempts.status, score: attempts.score, maxScore: attempts.maxScore, startedAt: attempts.startedAt, submittedAt: attempts.submittedAt })
          .from(attempts)
          .where(and(eq(attempts.candidateId, this.user.id), eq(attempts.isSandbox, true), inArray(attempts.examId, rows.map((r) => r.id))))
          .orderBy(desc(attempts.id))
      : [];
    return rows.map((r) => ({ ...r, attempts: mine.filter((m) => m.examId === r.id).slice(0, 10) }));
  }

  /** Immediate review of a submitted practice attempt: MCQs auto-marked with the key; written answers flagged as not auto-graded. */
  async review(attemptId: number) {
    const a = await this.db.select().from(attempts).where(eq(attempts.id, attemptId)).get();
    if (!a || a.candidateId !== this.user.id || !a.isSandbox) throw AppError.notFound("Practice attempt");
    const exam = await this.db.select().from(exams).where(eq(exams.id, a.examId)).get();
    if (!exam?.isPractice) throw AppError.notFound("Practice attempt");
    if (a.status === "in_progress") throw AppError.conflict("Submit the practice test to see your review.");
    const rows = await this.db.select().from(answers).where(eq(answers.attemptId, a.id));
    const questions = a.paper.map((p, i) => {
      const r = rows.find((x) => x.questionId === p.id);
      const written = p.type === "written";
      return {
        number: i + 1,
        id: p.id,
        type: p.type,
        prompt: p.prompt,
        topic: p.topic,
        difficulty: p.difficulty,
        marks: p.marks,
        options: p.options,
        response: r?.response ?? null,
        correct: written ? null : p.correct,
        awarded: written ? null : (r?.autoScore ?? 0),
        needsManualReview: written,
      };
    });
    const objective = questions.filter((q) => !q.needsManualReview);
    const objectiveMax = objective.reduce((s, q) => s + q.marks, 0);
    const objectiveScore = objective.reduce((s, q) => s + (q.awarded ?? 0), 0);
    return {
      attempt: { id: a.id, status: a.status, startedAt: a.startedAt, submittedAt: a.submittedAt },
      exam: { id: exam.id, title: exam.title },
      summary: {
        objectiveScore,
        objectiveMax,
        objectivePercent: pct(objectiveScore, objectiveMax),
        correct: objective.filter((q) => q.awarded === q.marks).length,
        partial: objective.filter((q) => (q.awarded ?? 0) > 0 && q.awarded !== q.marks).length,
        wrong: objective.filter((q) => (q.awarded ?? 0) === 0).length,
        writtenPending: questions.length - objective.length,
      },
      questions,
    };
  }
}
