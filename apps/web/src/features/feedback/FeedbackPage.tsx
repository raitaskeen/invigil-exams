"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ChatCircleText, CheckCircle, Copy, Key, Star } from "@phosphor-icons/react";
import { FEEDBACK_CATEGORIES, feedbackSchema, type FeedbackInput } from "@np/shared";
import { EmptyState, ErrorState, LoadingRows } from "@/components/feedback/States";
import { StatusBadge } from "@/components/feedback/StatusBadge";
import { FormField, textareaCls } from "@/components/form/FormField";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/layout/Panel";
import { Button } from "@/components/ui/button";
import { api, apiErrorMessage, applyFieldErrors } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { ago, fmtDateTime } from "@/lib/exams";
import { cn } from "@/lib/utils";

interface Feedback {
  id: number;
  category: FeedbackInput["category"];
  rating: number;
  message: string;
  status: "new" | "reviewed" | "resolved";
  staffNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
  fullName?: string;
  email?: string;
}

const CAT = Object.fromEntries(FEEDBACK_CATEGORIES.map((c) => [c.value, c.label])) as Record<string, string>;
const STATUS_TONE = { new: "info", reviewed: "warning", resolved: "success" } as const;

function Stars({ value, onChange, size = "md", label }: { value: number; onChange?: (n: number) => void; size?: "sm" | "md"; label?: string }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  if (!onChange)
    return (
      <span className="inline-flex" aria-label={`${value} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((n) => <Star key={n} weight={n <= value ? "fill" : "regular"} className={cn(size === "sm" ? "size-3.5" : "size-5", n <= value ? "text-warning" : "text-muted-foreground/40")} aria-hidden="true" />)}
      </span>
    );
  return (
    <div role="radiogroup" aria-label={label ?? "Rating"} className="flex gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(n)}
          className="rounded-md p-0.5 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-ring"
        >
          <Star weight={n <= shown ? "fill" : "regular"} className={cn("size-7", n <= shown ? "text-warning" : "text-muted-foreground/40")} />
        </button>
      ))}
    </div>
  );
}

export function FeedbackPage() {
  const { can } = useAuth();
  return (
    <div className="space-y-6">
      <PageHeader title="Feedback hub" description="Tell us what works and what doesn't. Every submission is read by the platform team." />
      {can("users:manage") ? <StaffReview /> : <MyFeedback />}
    </div>
  );
}

function MyFeedback() {
  const qc = useQueryClient();
  const mine = useQuery({ queryKey: ["feedback", "mine"], queryFn: () => api<{ items: Feedback[] }>("/feedback/mine") });
  const [sent, setSent] = useState<Feedback | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, setValue, watch, reset, setError, formState: { errors, isSubmitting } } = useForm<z.input<typeof feedbackSchema>, unknown, FeedbackInput>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: { category: "ui_ux", rating: 0, message: "" },
  });
  const rating = Number(watch("rating")) || 0;
  const category = watch("category");

  async function onSubmit(v: FeedbackInput) {
    setFormError(null);
    try {
      const row = await api<Feedback>("/feedback", { method: "POST", json: v });
      setSent(row);
      reset({ category: v.category, rating: 0, message: "" });
      qc.invalidateQueries({ queryKey: ["feedback", "mine"] });
    } catch (err) {
      if (!applyFieldErrors(err, setError)) setFormError(apiErrorMessage(err));
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <Panel title="Send feedback">
        {sent ? (
          <div className="flex flex-col items-center py-6 text-center animate-[rise_400ms_var(--ease-out)_backwards]">
            <span className="grid size-14 place-items-center rounded-2xl bg-success-soft text-success"><CheckCircle weight="fill" className="size-8" /></span>
            <h2 className="mt-4 text-lg font-semibold">Thank you - feedback received</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">Reference #{sent.id} · {CAT[sent.category]}. You can follow its status in your history.</p>
            <Button className="mt-5" variant="outline" onClick={() => setSent(null)}>Send more feedback</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5">
            <fieldset>
              <legend className="mb-2 text-sm font-medium">Category</legend>
              <div className="grid grid-cols-2 gap-2">
                {FEEDBACK_CATEGORIES.map((c) => (
                  <label key={c.value} className={cn("flex min-h-11 cursor-pointer items-center justify-center rounded-xl border px-3 text-sm font-medium transition-colors has-focus-visible:ring-[3px] has-focus-visible:ring-ring/25", category === c.value ? "border-primary bg-brand-soft text-brand-ink" : "border-border hover:border-border-strong")}>
                    <input type="radio" value={c.value} {...register("category")} className="sr-only" />
                    {c.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <div>
              <p className="mb-2 text-sm font-medium" id="rating-label">Rating</p>
              <Stars value={rating} label="Rating from 1 to 5" onChange={(n) => setValue("rating", n, { shouldValidate: true })} />
              {errors.rating && <p role="alert" className="mt-1 text-[0.8125rem] font-medium text-danger">{errors.rating.message}</p>}
            </div>
            <FormField label="Description" required error={errors.message?.message} hint="What happened, where, and what you expected.">
              {(p) => <textarea {...p} {...register("message")} rows={5} maxLength={2000} className={textareaCls} placeholder="The review screen..." />}
            </FormField>
            {formError && <p role="alert" className="text-sm text-danger">{formError}</p>}
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Sending..." : "Submit feedback"}</Button>
          </form>
        )}
      </Panel>
      <Panel title="Your submissions" bodyClassName="p-0">
        {mine.isLoading ? (
          <div className="p-5"><LoadingRows rows={3} /></div>
        ) : mine.error ? (
          <ErrorState title="Couldn't load your history" onRetry={() => mine.refetch()} />
        ) : !mine.data?.items.length ? (
          <EmptyState title="Nothing sent yet" description="Your feedback and its review status will appear here." />
        ) : (
          <ul className="divide-y divide-border">
            {mine.data.items.map((f) => (
              <li key={f.id} className="px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{CAT[f.category]}</span>
                  <Stars value={f.rating} size="sm" />
                  <StatusBadge tone={STATUS_TONE[f.status]} className="ms-auto capitalize">{f.status}</StatusBadge>
                </div>
                <p className="mt-1.5 line-clamp-3 text-sm text-foreground-soft">{f.message}</p>
                {f.staffNote && <p className="mt-2 rounded-lg bg-muted px-3 py-2 text-xs text-foreground-soft"><b>Team reply:</b> {f.staffNote}</p>}
                <p className="mt-1.5 text-xs text-muted-foreground">#{f.id} · {ago(f.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function StaffReview() {
  const qc = useQueryClient();
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const qs = new URLSearchParams(Object.entries({ status, category }).filter(([, v]) => v)).toString();
  const all = useQuery({ queryKey: ["feedback", "all", qs], queryFn: () => api<{ items: Feedback[]; stats: { category: string; n: number; avg: number }[] }>(`/feedback${qs ? `?${qs}` : ""}`) });
  const [notes, setNotes] = useState<Record<number, string>>({});
  const review = useMutation({
    mutationFn: ({ id, status: s }: { id: number; status: Feedback["status"] }) => api(`/feedback/${id}`, { method: "PATCH", json: { status: s, staffNote: notes[id] ?? null } }),
    onSuccess: () => {
      toast.success("Feedback updated");
      qc.invalidateQueries({ queryKey: ["feedback", "all"] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  return (
    <div className="space-y-6">
      <PasswordResets />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {FEEDBACK_CATEGORIES.map((c) => {
          const s = all.data?.stats.find((x) => x.category === c.value);
          return (
            <div key={c.value} className="rounded-[var(--radius-card)] border border-border bg-card p-4 shadow-xs">
              <p className="text-[0.8125rem] font-medium text-muted-foreground">{c.label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{s?.n ?? 0}</p>
              <p className="text-xs text-muted-foreground">{s ? `Average ${s.avg} / 5` : "No submissions"}</p>
            </div>
          );
        })}
      </div>
      <Panel
        title={<span className="inline-flex items-center gap-2"><ChatCircleText weight="duotone" className="size-4" aria-hidden="true" /> All feedback</span>}
        action={
          <div className="flex gap-2">
            <select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 rounded-lg border border-control-border/70 bg-surface px-2 text-sm">
              <option value="">Any status</option><option value="new">New</option><option value="reviewed">Reviewed</option><option value="resolved">Resolved</option>
            </select>
            <select aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value)} className="h-9 rounded-lg border border-control-border/70 bg-surface px-2 text-sm">
              <option value="">Any category</option>
              {FEEDBACK_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        }
        bodyClassName="p-0"
      >
        {all.isLoading ? (
          <div className="p-5"><LoadingRows rows={4} /></div>
        ) : all.error ? (
          <ErrorState title="Couldn't load feedback" onRetry={() => all.refetch()} />
        ) : !all.data?.items.length ? (
          <EmptyState title="No feedback matches" />
        ) : (
          <ul className="divide-y divide-border">
            {all.data.items.map((f) => (
              <li key={f.id} className="grid gap-3 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{f.fullName}</span>
                    <span className="text-xs text-muted-foreground">{f.email}</span>
                    <StatusBadge tone={STATUS_TONE[f.status]} className="capitalize">{f.status}</StatusBadge>
                  </div>
                  <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">{CAT[f.category]} · <Stars value={f.rating} size="sm" /> · {fmtDateTime(f.createdAt)}</p>
                  <p className="mt-2 text-sm text-foreground-soft">{f.message}</p>
                </div>
                <div className="space-y-2">
                  <textarea aria-label={`Reply to feedback ${f.id}`} rows={2} defaultValue={f.staffNote ?? ""} onChange={(e) => setNotes((n) => ({ ...n, [f.id]: e.target.value }))} placeholder="Optional reply shown to the user" className={cn(textareaCls, "min-h-16")} />
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" disabled={review.isPending} onClick={() => review.mutate({ id: f.id, status: "reviewed" })}>Mark reviewed</Button>
                    <Button size="sm" className="flex-1" disabled={review.isPending} onClick={() => review.mutate({ id: f.id, status: "resolved" })}>Resolve</Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

interface ResetRow {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  status: "requested" | "issued";
  requestedAt: string;
  expiresAt: string | null;
}

/** Admin: password reset requests -> issue a one-time code to hand to the user. */
export function PasswordResets() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["password-resets"], queryFn: () => api<{ items: ResetRow[] }>("/password-resets"), refetchInterval: 30_000 });
  const [issued, setIssued] = useState<{ userId: number; code: string; expiresAt: string } | null>(null);
  const issue = useMutation({
    mutationFn: (userId: number) => api<{ code: string; expiresAt: string }>(`/password-resets/users/${userId}/code`, { method: "POST" }),
    onSuccess: (r, userId) => {
      setIssued({ userId, ...r });
      qc.invalidateQueries({ queryKey: ["password-resets"] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });
  if (!q.data?.items.length && !issued) return null;
  return (
    <Panel title={<span className="inline-flex items-center gap-2"><Key weight="duotone" className="size-4 text-warning" aria-hidden="true" /> Password reset requests</span>} description="Verify the person, then issue a one-time code (valid 30 minutes). The code is shown once." bodyClassName="p-0">
      <ul className="divide-y divide-border">
        {(q.data?.items ?? []).map((r) => (
          <li key={r.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{r.fullName}</p>
              <p className="text-xs text-muted-foreground">{r.email} · requested {ago(r.requestedAt)}</p>
            </div>
            {issued?.userId === r.userId ? (
              <button type="button" onClick={() => navigator.clipboard?.writeText(issued.code).then(() => toast.success("Code copied"))} className="inline-flex items-center gap-2 rounded-lg border border-dashed border-primary bg-brand-soft px-3 py-1.5 font-mono text-base font-semibold tracking-widest text-brand-ink">
                {issued.code} <Copy className="size-4" aria-label="Copy code" />
              </button>
            ) : (
              <>
                {r.status === "issued" && <StatusBadge tone="warning">Code issued</StatusBadge>}
                <Button size="sm" disabled={issue.isPending} onClick={() => issue.mutate(r.userId)}>{r.status === "issued" ? "Issue new code" : "Issue code"}</Button>
              </>
            )}
          </li>
        ))}
      </ul>
    </Panel>
  );
}
