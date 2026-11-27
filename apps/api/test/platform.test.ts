import { describe, expect, it } from "vitest";
import { ADMIN, CANDIDATE2, EXAMINER, USER, call, login, registerFresh } from "./helpers/client";

const iso = (minsFromNow: number) => new Date(Date.now() + minsFromNow * 60_000).toISOString();

async function exam(ex: string, opts: { practice?: boolean } = {}) {
  const q1 = await call("/api/questions", { method: "POST", cookie: ex, json: { topic: "Maths", difficulty: "easy", type: "single", prompt: "What is 2 + 2?", options: [{ id: "a", text: "4" }, { id: "b", text: "5" }], correct: ["a"], marks: 5 } });
  const q2 = await call("/api/questions", { method: "POST", cookie: ex, json: { topic: "Maths", difficulty: "hard", type: "written", prompt: "Prove there are infinitely many primes.", marks: 5 } });
  const e = await call("/api/exams", { method: "POST", cookie: ex, json: { title: `Ranked ${Date.now()}`, startsAt: iso(-5), endsAt: iso(60), durationMinutes: 30, totalMarks: 10, isPractice: !!opts.practice } });
  expect(e.status).toBe(201);
  await call(`/api/exams/${e.data.id}/questions`, { method: "PUT", cookie: ex, json: { questionIds: [q1.data.id, q2.data.id] } });
  expect((await call(`/api/exams/${e.data.id}/publish`, { method: "POST", cookie: ex })).status).toBe(200);
  return { id: e.data.id as number, single: q1.data.id as number };
}

describe("password recovery", () => {
  it("does not reveal whether an account exists", async () => {
    const a = await call("/api/auth/forgot-password", { method: "POST", json: { email: "nobody@nowhere.dev" } });
    const b = await call("/api/auth/forgot-password", { method: "POST", json: { email: USER.email } });
    expect(a.status).toBe(202);
    expect(b.status).toBe(202);
    expect(a.data.message).toBe(b.data.message);
  });

  it("resets with an admin-issued one-time code and revokes old sessions", async () => {
    const fresh = await registerFresh();
    await call("/api/auth/forgot-password", { method: "POST", json: { email: fresh.email } });
    const admin = await login(ADMIN);
    const pending = await call("/api/password-resets", { cookie: admin });
    expect(pending.data.items.some((r: { email: string }) => r.email === fresh.email)).toBe(true);
    // Candidates can't issue codes.
    expect((await call(`/api/password-resets/users/${fresh.user.id}/code`, { method: "POST", cookie: fresh.cookie })).status).toBe(403);
    const issued = await call(`/api/password-resets/users/${fresh.user.id}/code`, { method: "POST", cookie: admin });
    expect(issued.status).toBe(201);
    const bad = await call("/api/auth/reset-password", { method: "POST", json: { email: fresh.email, code: "AAAAAAAA", password: "NewPassw0rd", confirm: "NewPassw0rd" } });
    expect(bad.status).toBe(400);
    const ok = await call("/api/auth/reset-password", { method: "POST", json: { email: fresh.email, code: issued.data.code, password: "NewPassw0rd", confirm: "NewPassw0rd" } });
    expect(ok.status).toBe(200);
    expect((await call("/api/auth/me", { cookie: fresh.cookie })).status).toBe(401);
    expect((await call("/api/auth/login", { method: "POST", json: { email: fresh.email, password: "NewPassw0rd" } })).status).toBe(200);
    // Single use.
    const reuse = await call("/api/auth/reset-password", { method: "POST", json: { email: fresh.email, code: issued.data.code, password: "Other0pass", confirm: "Other0pass" } });
    expect(reuse.status).toBe(400);
  });
});

describe("rankings", () => {
  it("gives examiners the full table and candidates only their own position", async () => {
    const ex = await login(EXAMINER);
    const { id, single } = await exam(ex);
    await call(`/api/exams/${id}/enrollments`, { method: "POST", cookie: ex, json: { emails: [USER.email, CANDIDATE2.email] } });
    const c1 = await login(USER);
    const c2 = await login(CANDIDATE2);
    for (const [cookie, pick] of [[c1, "a"], [c2, "b"]] as const) {
      const s = await call(`/api/me/exams/${id}/start`, { method: "POST", cookie });
      await call(`/api/attempts/${s.data.attemptId}/answer`, { method: "PUT", cookie, json: { questionId: single, response: [pick] } });
      await call(`/api/attempts/${s.data.attemptId}/submit`, { method: "POST", cookie });
    }
    const table = await call(`/api/exams/${id}/rankings`, { cookie: ex });
    expect(table.status).toBe(200);
    expect(table.data.rankings).toHaveLength(2);
    expect(table.data.rankings[0]).toMatchObject({ rank: 1, fullName: "Cara Candidate" });
    // Candidates are denied the full table.
    expect((await call(`/api/exams/${id}/rankings`, { cookie: c1 })).status).toBe(403);

    await call(`/api/exams/${id}/results/publish`, { method: "POST", cookie: ex });
    const mine = (await call("/api/me/results", { cookie: c2 })).data.find((r: { examId: number }) => r.examId === id);
    const rank = await call(`/api/attempts/${mine.attemptId}/rank`, { cookie: c2 });
    expect(rank.status).toBe(200);
    expect(rank.data).toMatchObject({ rank: 2, total: 2 });
    const body = JSON.stringify(rank.data);
    expect(body).not.toContain("Cara");
    expect(body).not.toContain(USER.email);
    // Someone else's attempt is invisible.
    expect((await call(`/api/attempts/${mine.attemptId}/rank`, { cookie: c1 })).status).toBe(404);
  });
});

describe("practice tests", () => {
  it("auto-marks MCQs, flags written answers and never appears in official views", async () => {
    const ex = await login(EXAMINER);
    const { id, single } = await exam(ex, { practice: true });
    const c1 = await login(USER);
    const list = await call("/api/practice", { cookie: c1 });
    expect(list.data.items.some((p: { id: number }) => p.id === id)).toBe(true);
    // Not startable as an official exam.
    expect((await call(`/api/me/exams/${id}/start`, { method: "POST", cookie: c1 })).status).toBeGreaterThanOrEqual(400);
    const s = await call(`/api/practice/${id}/start`, { method: "POST", cookie: c1 });
    expect(s.status).toBe(201);
    await call(`/api/attempts/${s.data.attemptId}/answer`, { method: "PUT", cookie: c1, json: { questionId: single, response: ["a"] } });
    await call(`/api/attempts/${s.data.attemptId}/submit`, { method: "POST", cookie: c1 });
    const review = await call(`/api/practice/attempts/${s.data.attemptId}/review`, { cookie: c1 });
    expect(review.status).toBe(200);
    expect(review.data.summary).toMatchObject({ objectiveScore: 5, objectiveMax: 5, writtenPending: 1 });
    expect(review.data.questions.find((q: { type: string }) => q.type === "written")).toMatchObject({ awarded: null, needsManualReview: true });
    // Isolation: not in rankings, monitor or the candidate's official results.
    expect((await call(`/api/exams/${id}/rankings`, { cookie: ex })).data.rankings).toHaveLength(0);
    const results = await call("/api/me/results", { cookie: c1 });
    expect(results.data.some((r: { examId: number }) => r.examId === id)).toBe(false);
  });
});

describe("feedback hub", () => {
  it("validates, keeps history per user and lets admins review", async () => {
    const c1 = await login(USER);
    expect((await call("/api/feedback", { method: "POST", cookie: c1, json: { category: "ui_ux", rating: 9, message: "short" } })).status).toBe(422);
    const ok = await call("/api/feedback", { method: "POST", cookie: c1, json: { category: "exam_experience", rating: 4, message: "The timer was very clear and easy to follow." } });
    expect(ok.status).toBe(201);
    expect((await call("/api/feedback/mine", { cookie: c1 })).data.items[0].id).toBe(ok.data.id);
    expect((await call("/api/feedback", { cookie: c1 })).status).toBe(403);
    const admin = await login(ADMIN);
    expect((await call("/api/feedback", { cookie: admin })).data.items.some((f: { id: number }) => f.id === ok.data.id)).toBe(true);
    expect((await call(`/api/feedback/${ok.data.id}`, { method: "PATCH", cookie: admin, json: { status: "reviewed", staffNote: "Thanks!" } })).data.status).toBe("reviewed");
  });
});

describe("past papers", () => {
  it("examiners upload, candidates browse and download", async () => {
    const ex = await login(EXAMINER);
    const c1 = await login(USER);
    const file = { name: "maths-2024.txt", mimeType: "text/plain", base64: btoa("Q1. Integrate x^2.") };
    expect((await call("/api/papers", { method: "POST", cookie: c1, json: { title: "Maths Final", subject: "Mathematics", year: 2024, examType: "final", file } })).status).toBe(403);
    const up = await call("/api/papers", { method: "POST", cookie: ex, json: { title: "Maths Final", subject: "Mathematics", year: 2024, examType: "final", file } });
    expect(up.status).toBe(201);
    const list = await call("/api/papers?subject=Mathematics", { cookie: c1 });
    expect(list.data.items.some((p: { id: number }) => p.id === up.data.id)).toBe(true);
    expect(list.data.subjects).toContain("Mathematics");
    const dl = await call(`/api/papers/${up.data.id}/file`, { cookie: c1 });
    expect(dl.status).toBe(200);
    expect(dl.data).toContain("Integrate");
  });
});
