/**
 * Built-in platform guide for the floating help bot. Every entry describes something the product really does.
 * Works with no external API: questions are matched by keywords. If GROQ_API_KEY is set, the guide is also
 * given to the model as grounding so it answers only from these facts.
 */
export type HelpRole = "guest" | "candidate" | "examiner" | "admin";

interface Entry {
  id: string;
  roles: HelpRole[] | "all";
  keywords: string[];
  title: string;
  answer: string;
  link?: { label: string; href: string };
}

const ALL = "all" as const;

export const GUIDE: Entry[] = [
  { id: "register", roles: ["guest"], keywords: ["register", "sign up", "signup", "create account", "account", "join"], title: "Creating an account", answer: "Open **Create account**, enter your full name, email and a password (8+ characters with a letter and a number). New accounts are candidate accounts; examiner and admin accounts are created by an administrator.", link: { label: "Create account", href: "/register" } },
  { id: "login", roles: ALL, keywords: ["login", "log in", "sign in", "signin", "demo"], title: "Signing in", answer: "Use **Sign in** with your email and password, or one of the demo accounts on the sign-in page. Sessions use a secure httpOnly cookie and last 12 hours.", link: { label: "Sign in", href: "/login" } },
  { id: "forgot", roles: ALL, keywords: ["forgot", "reset", "password", "lost password", "change password", "code"], title: "Forgot password", answer: "On the sign-in page choose **Forgot password?** and enter your email. An administrator issues you a one-time 8-character code (valid 30 minutes). Enter it with your new password; all other sessions are signed out." },
  { id: "take", roles: ["candidate", "guest"], keywords: ["start", "take", "exam", "attempt", "begin", "my exams", "live"], title: "Taking an exam", answer: "Open **My exams** and press **Start** when the exam is open. The workspace shows a server-kept timer; your deadline is the earlier of start + duration and the exam window end. Answers save automatically; flag questions to review and use the review screen before **Submit**.", link: { label: "My exams", href: "/app/exams" } },
  { id: "offline", roles: ALL, keywords: ["internet", "offline", "wifi", "wi-fi", "connection", "network", "disconnect", "drop", "lost"], title: "If the connection drops", answer: "Keep answering. Answers are queued on your device and retried with backoff, then sent automatically when you reconnect. The timer does not pause. Refreshing or switching device resumes the same attempt with the same time left." },
  { id: "timer", roles: ["candidate", "guest"], keywords: ["time", "timer", "deadline", "clock", "extra time", "late"], title: "The timer", answer: "Time is kept by the server, so refreshing doesn't change it. Saves in flight within 5 seconds of the deadline still count. When time runs out the attempt is submitted with everything saved. Examiners can add time for a verified disruption." },
  { id: "integrity", roles: ALL, keywords: ["cheat", "integrity", "tab", "switch", "monitor", "proctor", "webcam", "camera", "copy", "paste"], title: "Integrity signals", answer: "Invigil records neutral signals such as tab switches, focus loss and long disconnects for the examiner to review. They are never treated as proof and never penalise you automatically. There is no webcam or screen recording." },
  { id: "results", roles: ["candidate", "guest"], keywords: ["result", "score", "marks", "grade", "published", "pdf", "report"], title: "Results", answer: "MCQs are marked automatically; written answers are graded by the examiner. Once results are published, **Results** shows your score, a question breakdown, your own position among candidates and a PDF report.", link: { label: "Results", href: "/app/results" } },
  { id: "rank", roles: ["candidate"], keywords: ["rank", "position", "percentile", "leaderboard", "top", "compare"], title: "Your rank", answer: "Each published result shows **your** position (for example #4 of 28), your percentile and an anonymous score distribution. Other candidates' names and scores are never shown to candidates." },
  { id: "dispute", roles: ["candidate"], keywords: ["dispute", "appeal", "wrong", "unfair", "recheck", "challenge"], title: "Raising a dispute", answer: "Open the result, pick the question and press **Raise a dispute** with your reason. The examiner accepts or rejects it with a written response, and any score change is recorded.", link: { label: "Disputes", href: "/app/disputes" } },
  { id: "verify", roles: ALL, keywords: ["verify", "verification", "qr", "authentic", "certificate", "genuine"], title: "Verifying a result", answer: "Every published result has a verification code and a QR code on its PDF. Anyone can enter the code on **Verify** to confirm the exam, score and date without signing in. Names are masked.", link: { label: "Verify a result", href: "/verify" } },
  { id: "practice", roles: ["candidate", "guest"], keywords: ["practice", "mock", "sample test", "prepare", "revision", "self test"], title: "Practice tests", answer: "**Practice** lists mock tests published by examiners. Take them as often as you like; MCQs are marked instantly with an answer review. Written answers are not auto-graded. Practice attempts never appear in official results, rankings or examiner submissions.", link: { label: "Practice", href: "/app/practice" } },
  { id: "papers", roles: ALL, keywords: ["past paper", "past papers", "previous", "old paper", "year", "download paper"], title: "Past papers", answer: "**Past papers** has previous years' papers uploaded by examiners. Filter by subject, year and exam type, then view or download.", link: { label: "Past papers", href: "/app/papers" } },
  { id: "feedback", roles: ALL, keywords: ["feedback", "suggest", "bug", "issue", "complaint", "rate", "review"], title: "Feedback hub", answer: "Use the **Feedback hub** to send UI/UX, technical, exam-experience or suggestion feedback with a 1-5 rating. You can see your own history and its review status.", link: { label: "Feedback", href: "/app/feedback" } },
  { id: "questions", roles: ["examiner", "admin"], keywords: ["question", "bank", "mcq", "import", "csv", "written", "multiple"], title: "Question bank", answer: "**Question bank** stores single-answer, multi-select and written questions with topic, difficulty, marks and exact or partial marking. Import many at once from CSV or JSON with row-by-row validation.", link: { label: "Question bank", href: "/app/questions" } },
  { id: "create", roles: ["examiner", "admin"], keywords: ["create exam", "new exam", "publish", "setup", "checklist", "schedule", "practice test"], title: "Creating an exam", answer: "Open **Exams -> New exam**, set the window, duration, marks and pass mark, add questions, then publish. The setup checklist blocks publishing until marks add up and any draw plan can be met. Tick **Practice test** to make it a mock test candidates can take freely.", link: { label: "Exams", href: "/app/exams" } },
  { id: "enrol", roles: ["examiner", "admin"], keywords: ["enrol", "enroll", "candidates", "students", "invite", "add students"], title: "Enrolling candidates", answer: "In an exam's **Candidates** tab, paste emails or upload a CSV. Unknown emails are reported back so you can fix them." },
  { id: "monitorx", roles: ["examiner", "admin"], keywords: ["monitor", "live", "announce", "announcement", "extend", "extra time", "watch"], title: "Live monitoring", answer: "The **Monitor** tab shows each candidate's progress, online status and integrity signals in real time. Send announcements, or add time for a verified disruption with the reason recorded." },
  { id: "grading", roles: ["examiner", "admin"], keywords: ["grade", "grading", "mark", "written", "manual", "publish results"], title: "Grading and results", answer: "Objective answers mark themselves. Written answers queue in **Grading** with mark limits enforced. Publish results from the **Results** tab when ready." },
  { id: "rankx", roles: ["examiner", "admin"], keywords: ["rank", "ranking", "leaderboard", "top", "compare", "position", "analytics"], title: "Rankings and analytics", answer: "The exam **Results** tab has the full sortable, filterable ranking table (names, scores, positions, time taken, pass/fail) and analytics. Only examiners of that exam and admins can see it." },
  { id: "sandbox", roles: ["examiner", "admin"], keywords: ["preview", "sandbox", "try", "test exam"], title: "Preview in sandbox", answer: "Preview an exam as a candidate in a sandbox before publishing. Sandbox attempts never count anywhere." },
  { id: "users", roles: ["admin"], keywords: ["user", "role", "deactivate", "admin", "examiner account", "bulk"], title: "Managing users", answer: "**Users** lets admins create users, change roles, deactivate accounts (signed out everywhere immediately) and bulk-import from CSV. Password reset requests and one-time codes are handled there too.", link: { label: "Users", href: "/app/users" } },
];

export function suggestionsFor(role: HelpRole): string[] {
  const by: Record<HelpRole, string[]> = {
    guest: ["How do I create an account?", "What happens if my internet drops?", "How can a result be verified?", "Are there practice tests?"],
    candidate: ["How do I start my exam?", "What if my Wi-Fi drops mid-exam?", "Where can I see my rank?", "How do I raise a dispute?"],
    examiner: ["How do I create and publish an exam?", "How do I enrol candidates?", "Where is the ranking table?", "How do I grade written answers?"],
    admin: ["How do I deactivate a user?", "How do password resets work?", "Where is the ranking table?", "How do I review feedback?"],
  };
  return by[role];
}

const visible = (e: Entry, role: HelpRole) => e.roles === "all" || e.roles.includes(role) || role === "admin";

export function guideText(role: HelpRole) {
  return GUIDE.filter((e) => visible(e, role))
    .map((e) => `- ${e.title}: ${e.answer.replaceAll("**", "")}${e.link ? ` (page: ${e.link.href})` : ""}`)
    .join("\n");
}

/** Keyword scoring over the guide; returns the best entries for this role. */
export function matchGuide(question: string, role: HelpRole) {
  const q = ` ${question.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ")} `;
  const scored = GUIDE.filter((e) => visible(e, role))
    .map((e) => ({
      e,
      score: e.keywords.reduce((s, k) => (q.includes(` ${k}`) || q.includes(`${k} `) ? s + k.split(" ").length * 2 : q.includes(k) ? s + 1 : s), 0) + (e.roles !== "all" && e.roles.includes(role) ? 0.5 : 0),
    }))
    .filter((x) => x.score >= 1)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, 2).map((x) => x.e);
}
