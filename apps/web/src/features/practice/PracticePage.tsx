"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRight, CaretLeft, CheckCircle, Clock, Exam, Info, ListChecks, MinusCircle, PencilLine, XCircle } from "@phosphor-icons/react";
import { EmptyState, ErrorState, LoadingRows } from "@/components/feedback/States";
import { StatusBadge } from "@/components/feedback/StatusBadge";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/layout/Panel";
import { Button } from "@/components/ui/button";
import { ScoreRing } from "@/features/results/ScoreRing";
import { api, apiErrorMessage } from "@/lib/api-client";
import { ago, fmtDateTime, fmtMarks, pct } from "@/lib/exams";
import { cn } from "@/lib/utils";

interface PracticeAttempt {
  id: number;
  status: string;
  score: number | null;
  maxScore: number;
  startedAt: string;
  submittedAt: string | null;
}
interface PracticeTest {
  id: number;
  title: string;
  instructions: string;
  durationMinutes: number;
  totalMarks: number;
  questions: number;
  attempts: PracticeAttempt[];
}

export function PracticePage() {
  const router = useRouter();
  const q = useQuery({ queryKey: ["practice"], queryFn: () => api<{ items: PracticeTest[] }>("/practice") });
  const [starting, setStarting] = useState<number | null>(null);

  async function start(id: number) {
    setStarting(id);
    try {
      const r = await api<{ attemptId: number }>(`/practice/${id}/start`, { method: "POST" });
      router.push(`/exam?attempt=${r.attemptId}`);
    } catch (err) {
      toast.error(apiErrorMessage(err));
      setStarting(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Practice tests"
        description="Mock tests from your examiners. Take them as often as you like - multiple-choice answers are marked the moment you submit."
      />
      <div className="flex items-start gap-3 rounded-[var(--radius-card)] border border-border bg-brand-soft/50 px-4 py-3 text-sm text-foreground-soft">
        <Info weight="duotone" className="mt-0.5 size-5 shrink-0 text-brand-ink" aria-hidden="true" />
        <p>Practice attempts are kept separately. They never appear in official results, rankings or your examiner&apos;s submissions. Written answers are not auto-graded.</p>
      </div>
      {q.isLoading ? (
        <LoadingRows rows={3} />
      ) : q.error ? (
        <ErrorState title="Couldn't load practice tests" onRetry={() => q.refetch()} />
      ) : !q.data?.items.length ? (
        <EmptyState title="No practice tests yet" description="When an examiner publishes a mock test, it appears here." />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {q.data.items.map((t, i) => {
            const open = t.attempts.find((a) => a.status === "in_progress");
            const done = t.attempts.filter((a) => a.status !== "in_progress");
            return (
              <li key={t.id} className="flex flex-col rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-xs transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md animate-[rise_400ms_var(--ease-out)_backwards]" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-ink">
                    <Exam weight="duotone" className="size-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold">{t.title}</h2>
                    <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><ListChecks className="size-3.5" aria-hidden="true" />{t.questions} questions</span>
                      <span className="inline-flex items-center gap-1"><Clock className="size-3.5" aria-hidden="true" />{t.durationMinutes} min</span>
                      <span>{fmtMarks(t.totalMarks)} marks</span>
                    </p>
                  </div>
                </div>
                {t.instructions && <p className="mt-3 line-clamp-2 text-sm text-foreground-soft">{t.instructions}</p>}
                {done.length > 0 && (
                  <div className="mt-4 border-t border-border pt-3">
                    <p className="text-xs font-medium text-muted-foreground">Your recent attempts</p>
                    <ul className="mt-2 space-y-1">
                      {done.slice(0, 3).map((a) => (
                        <li key={a.id}>
                          <Link href={`/app/practice/review?attempt=${a.id}`} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-muted">
                            <span className="text-muted-foreground">{ago(a.submittedAt)}</span>
                            <span className="tabular-nums">{fmtMarks(a.score)}/{fmtMarks(a.maxScore)} · review <ArrowRight className="inline size-3" aria-hidden="true" /></span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="mt-auto pt-4">
                  <Button className="w-full" disabled={starting !== null} onClick={() => start(t.id)}>
                    {starting === t.id ? "Opening..." : open ? "Resume practice" : done.length ? "Practise again" : "Start practice"}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ---- Review -----------------------------------------------------------------------------------------------------

interface Review {
  attempt: { id: number; status: string; startedAt: string; submittedAt: string | null };
  exam: { id: number; title: string };
  summary: { objectiveScore: number; objectiveMax: number; objectivePercent: number; correct: number; partial: number; wrong: number; writtenPending: number };
  questions: {
    number: number;
    id: number;
    type: "single" | "multiple" | "written";
    prompt: string;
    topic: string;
    marks: number;
    options: { id: string; text: string }[];
    response: string[] | string | null;
    correct: string[] | null;
    awarded: number | null;
    needsManualReview: boolean;
  }[];
}

export function PracticeReviewPage() {
  const id = Number(useSearchParams().get("attempt")) || 0;
  const q = useQuery({ queryKey: ["practice-review", id], queryFn: () => api<Review>(`/practice/attempts/${id}/review`), enabled: id > 0 });
  if (q.isLoading) return <LoadingRows rows={6} />;
  if (q.error || !q.data) return <ErrorState title="Review not available" description="Submit the practice test first. You can only see your own practice attempts." onRetry={() => q.refetch()} />;
  const { summary: s, exam, questions, attempt } = q.data;
  const percent = s.objectiveMax ? s.objectivePercent : pct(0, 1);

  return (
    <div className="space-y-6">
      <Link href="/app/practice" className="inline-flex min-h-10 items-center gap-1 text-sm text-muted-foreground hover:text-foreground pointer-fine:min-h-8">
        <CaretLeft className="size-4 rtl:rotate-180" aria-hidden="true" /> Practice tests
      </Link>
      <section className="flex flex-col gap-6 rounded-[1.25rem] border border-border bg-card p-6 shadow-xs sm:flex-row sm:items-center sm:p-8">
        <ScoreRing percent={percent} passed={percent >= 50} size={120} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-[-0.03em]">{exam.title}</h1>
            <StatusBadge tone="neutral">Practice · not official</StatusBadge>
          </div>
          <p className="mt-1 text-foreground-soft tabular-nums">
            {fmtMarks(s.objectiveScore)} of {fmtMarks(s.objectiveMax)} multiple-choice marks · submitted {fmtDateTime(attempt.submittedAt)}
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { k: "Correct", v: s.correct, cls: "text-success" },
              { k: "Partly right", v: s.partial, cls: "text-warning" },
              { k: "Wrong / blank", v: s.wrong, cls: "text-danger" },
              { k: "Written (manual)", v: s.writtenPending, cls: "text-muted-foreground" },
            ].map((x) => (
              <div key={x.k} className="rounded-xl border border-border bg-surface px-3 py-2">
                <dt className="text-xs text-muted-foreground">{x.k}</dt>
                <dd className={cn("text-xl font-semibold tabular-nums", x.cls)}>{x.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <Panel title="Answer review" description="Correct options are marked. Written answers need an examiner and are not auto-graded." bodyClassName="p-0">
        <ol className="divide-y divide-border">
          {questions.map((qq) => {
            const picked = Array.isArray(qq.response) ? qq.response : [];
            const full = qq.awarded != null && qq.awarded === qq.marks;
            return (
              <li key={qq.id} className="px-5 py-5">
                <div className="flex items-start justify-between gap-4">
                  <p className="font-medium">
                    <span className="me-2 text-muted-foreground tabular-nums">{qq.number}.</span>
                    {qq.prompt}
                  </p>
                  {qq.needsManualReview ? (
                    <StatusBadge tone="neutral">Manual review</StatusBadge>
                  ) : (
                    <StatusBadge tone={full ? "success" : (qq.awarded ?? 0) > 0 ? "warning" : "danger"}>
                      {fmtMarks(qq.awarded)}/{fmtMarks(qq.marks)}
                    </StatusBadge>
                  )}
                </div>
                {qq.type === "written" ? (
                  <div className="mt-3 space-y-2">
                    <p className="rounded-xl bg-muted px-3 py-2 text-sm whitespace-pre-wrap text-foreground-soft">{typeof qq.response === "string" && qq.response.trim() ? qq.response : "No answer written."}</p>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><PencilLine className="size-3.5" aria-hidden="true" /> Written answers require manual evaluation and are not scored in practice.</p>
                  </div>
                ) : (
                  <ul className="mt-3 grid gap-1.5">
                    {qq.options.map((o) => {
                      const isKey = qq.correct?.includes(o.id);
                      const isPicked = picked.includes(o.id);
                      return (
                        <li key={o.id} className={cn("flex items-center gap-2 rounded-lg border px-3 py-2 text-sm", isKey ? "border-success/40 bg-success-soft" : isPicked ? "border-danger/40 bg-danger-soft" : "border-border")}>
                          {isKey ? <CheckCircle weight="fill" className="size-4 shrink-0 text-success" aria-label="Correct option" /> : isPicked ? <XCircle weight="fill" className="size-4 shrink-0 text-danger" aria-label="Your incorrect choice" /> : <MinusCircle className="size-4 shrink-0 text-muted-foreground/50" aria-hidden="true" />}
                          <span className="flex-1">{o.text}</span>
                          {isPicked && <span className="text-xs font-medium text-muted-foreground">Your answer</span>}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ol>
      </Panel>
      <div className="flex justify-end">
        <Button render={<Link href="/app/practice" />}>Back to practice tests</Button>
      </div>
    </div>
  );
}
