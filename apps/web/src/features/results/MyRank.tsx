"use client";

import { useQuery } from "@tanstack/react-query";
import { Medal, Users } from "@phosphor-icons/react";
import { Panel } from "@/components/layout/Panel";
import { api } from "@/lib/api-client";
import { fmtMarks } from "@/lib/exams";
import { cn } from "@/lib/utils";

interface Rank {
  rank: number;
  total: number;
  percentile: number;
  score: number | null;
  maxScore: number;
  percent: number;
  meanPercent: number;
  bands: { from: number; to: number; count: number; mine: boolean }[];
}

const ordinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
};

/**
 * The candidate's own position. The API returns only this candidate's rank and anonymous counts per 10% band -
 * never other candidates' names or scores.
 */
export function MyRank({ attemptId }: { attemptId: number }) {
  const q = useQuery({ queryKey: ["rank", attemptId], queryFn: () => api<Rank>(`/attempts/${attemptId}/rank`) });
  if (q.isLoading) return <div className="h-48 animate-pulse rounded-[var(--radius-card)] bg-muted" aria-label="Loading your position" />;
  if (!q.data) return null;
  const r = q.data;
  const peak = Math.max(1, ...r.bands.map((b) => b.count));
  const top = r.total > 1 ? Math.max(1, Math.round((r.rank / r.total) * 100)) : 100;
  return (
    <Panel title="Your position" description="Only your own rank is shown. Other candidates appear only as anonymous counts.">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
        <div>
          <div className="flex items-center gap-4">
            <span className={cn("grid size-14 shrink-0 place-items-center rounded-2xl", r.rank <= 3 ? "bg-warning-soft text-warning" : "bg-brand-soft text-brand-ink")}>
              <Medal weight="duotone" className="size-8" aria-hidden="true" />
            </span>
            <p className="text-lg leading-snug font-semibold text-pretty">
              You secured position <span className="text-primary tabular-nums">#{r.rank}</span> out of <span className="tabular-nums">{r.total}</span> candidate{r.total === 1 ? "" : "s"}.
            </p>
          </div>
          <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
            {[
              { k: "Your score", v: `${fmtMarks(r.score)}/${fmtMarks(r.maxScore)}`, h: `${r.percent}%` },
              { k: "Percentile", v: ordinal(r.percentile), h: r.total > 1 ? `Top ${top}%` : "Only candidate" },
              { k: "Class average", v: `${r.meanPercent}%`, h: r.percent >= r.meanPercent ? `+${Math.round((r.percent - r.meanPercent) * 10) / 10} pts` : `${Math.round((r.percent - r.meanPercent) * 10) / 10} pts` },
            ].map((s) => (
              <div key={s.k} className="rounded-xl border border-border bg-surface px-2 py-3">
                <dt className="text-xs text-muted-foreground">{s.k}</dt>
                <dd className="mt-1 text-lg font-semibold tabular-nums">{s.v}</dd>
                <dd className="text-xs text-muted-foreground tabular-nums">{s.h}</dd>
              </div>
            ))}
          </dl>
        </div>
        <figure>
          <div className="flex h-40 items-end gap-1.5" role="img" aria-label={`Score distribution of ${r.total} candidates in 10% bands. Your band is ${Math.min(90, Math.floor(r.percent / 10) * 10)} to ${Math.min(100, Math.floor(r.percent / 10) * 10 + 10)} percent.`}>
            {r.bands.map((b) => (
              <div key={b.from} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                <span className="text-[0.6875rem] text-muted-foreground tabular-nums">{b.count || ""}</span>
                <div
                  className={cn("w-full rounded-t-md transition-[height] duration-700 ease-[var(--ease-out)]", b.mine ? "bg-primary" : "bg-muted-foreground/25")}
                  style={{ height: `${Math.max(b.count ? 6 : 2, (b.count / peak) * 100)}%` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-1.5 flex gap-1.5 text-[0.625rem] text-muted-foreground tabular-nums">
            {r.bands.map((b) => (
              <span key={b.from} className="flex-1 text-center">{b.from}</span>
            ))}
          </div>
          <figcaption className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-primary" /> Your band</span>
            <span className="flex items-center gap-1.5"><Users className="size-3.5" aria-hidden="true" /> Candidates per score band (%)</span>
          </figcaption>
        </figure>
      </div>
    </Panel>
  );
}
