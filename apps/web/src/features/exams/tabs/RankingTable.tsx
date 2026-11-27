"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CaretDown, CaretUp, DownloadSimple, MagnifyingGlass, Trophy } from "@phosphor-icons/react";
import { EmptyState, ErrorState, LoadingRows } from "@/components/feedback/States";
import { StatusBadge } from "@/components/feedback/StatusBadge";
import { Meter, Panel } from "@/components/layout/Panel";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import { fmtDateTime, fmtMarks, saveText } from "@/lib/exams";
import { cn } from "@/lib/utils";

interface Row {
  attemptId: number;
  candidateId: number;
  fullName: string;
  email: string;
  score: number | null;
  maxScore: number;
  percent: number;
  rank: number;
  passed: boolean;
  status: string;
  pendingManual: number;
  submittedAt: string | null;
  durationMinutes: number | null;
}
interface Rankings {
  exam: { id: number; title: string; passPercent: number };
  summary: { candidates: number; meanPercent: number; topPercent: number; passed: number };
  rankings: Row[];
}

type SortKey = "rank" | "fullName" | "percent" | "durationMinutes" | "submittedAt";
type Filter = "all" | "pass" | "below" | "grading";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pass", label: "Passed" },
  { id: "below", label: "Below pass" },
  { id: "grading", label: "To grade" },
];

const csvCell = (v: string | number | null) => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Examiner/admin only (the API enforces exams:manage + exam ownership): the full ranked table. */
export function RankingTable({ examId }: { examId: number }) {
  const q = useQuery({ queryKey: ["exam", examId, "rankings"], queryFn: () => api<Rankings>(`/exams/${examId}/rankings`) });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "rank", dir: 1 });

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = (q.data?.rankings ?? []).filter(
      (r) =>
        (!term || r.fullName.toLowerCase().includes(term) || r.email.toLowerCase().includes(term)) &&
        (filter === "all" ||
          (filter === "pass" && r.passed && !r.pendingManual) ||
          (filter === "below" && !r.passed && !r.pendingManual) ||
          (filter === "grading" && r.pendingManual > 0)),
    );
    return [...list].sort((a, b) => {
      const av = a[sort.key] ?? "";
      const bv = b[sort.key] ?? "";
      return (av < bv ? -1 : av > bv ? 1 : 0) * sort.dir;
    });
  }, [q.data, search, filter, sort]);

  if (q.isLoading) return <LoadingRows rows={5} />;
  if (q.error || !q.data) return <ErrorState title="Rankings unavailable" onRetry={() => q.refetch()} />;
  const { summary } = q.data;

  const th = (key: SortKey, label: string, cls = "") => {
    const active = sort.key === key;
    return (
      <th className={cn("px-3 py-2.5 font-medium", cls)} aria-sort={active ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
        <button
          type="button"
          onClick={() => setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : key === "percent" ? -1 : 1 }))}
          className={cn("inline-flex items-center gap-1 rounded hover:text-foreground", active && "text-foreground")}
        >
          {label}
          {active ? sort.dir === 1 ? <CaretUp className="size-3" aria-hidden="true" /> : <CaretDown className="size-3" aria-hidden="true" /> : null}
        </button>
      </th>
    );
  };

  const exportCsv = () => {
    const head = "rank,name,email,score,max_score,percent,outcome,minutes,submitted_at";
    const body = rows.map((r) =>
      [r.rank, r.fullName, r.email, r.score, r.maxScore, r.percent, r.pendingManual ? "to_grade" : r.passed ? "pass" : "below_pass", r.durationMinutes, r.submittedAt].map(csvCell).join(","),
    );
    saveText([head, ...body].join("\n"), `exam-${examId}-rankings.csv`);
  };

  return (
    <Panel
      title={
        <span className="inline-flex items-center gap-2">
          <Trophy weight="duotone" className="size-4 text-warning" aria-hidden="true" /> Candidate rankings
        </span>
      }
      description={`${summary.candidates} finished · mean ${summary.meanPercent}% · top ${summary.topPercent}% · ${summary.passed} passed. Ties share a position.`}
      action={
        <Button size="sm" variant="outline" onClick={exportCsv} disabled={!rows.length}>
          <DownloadSimple /> CSV
        </Button>
      }
      bodyClassName="p-0"
    >
      <div className="flex flex-col gap-3 border-b border-border px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block sm:w-64">
          <span className="sr-only">Search candidates</span>
          <MagnifyingGlass className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email"
            className="h-9 w-full rounded-[var(--radius-control)] border border-control-border/70 bg-surface ps-9 pe-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25"
          />
        </label>
        <div role="radiogroup" aria-label="Filter by outcome" className="flex gap-1 overflow-x-auto rounded-lg bg-muted p-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="radio"
              aria-checked={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={cn("rounded-md px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors", filter === f.id ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground")}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      {!summary.candidates ? (
        <EmptyState title="No finished attempts yet" description="Rankings appear as candidates submit. Practice and sandbox attempts are never included." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[44rem] text-sm">
            <caption className="sr-only">Candidates ranked by score for {q.data.exam.title}</caption>
            <thead className="border-b border-border bg-surface-sunken/60 text-xs text-muted-foreground">
              <tr>
                {th("rank", "Rank", "ps-5 text-start")}
                {th("fullName", "Candidate", "text-start")}
                {th("percent", "Score", "text-start")}
                {th("durationMinutes", "Time", "text-end")}
                {th("submittedAt", "Submitted", "text-start")}
                <th className="px-5 py-2.5 text-end font-medium">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => (
                <tr key={r.attemptId} className="transition-colors hover:bg-muted/40">
                  <td className="py-3 ps-5 pe-3">
                    <span className={cn("inline-grid size-7 place-items-center rounded-full text-xs font-semibold tabular-nums", r.rank === 1 ? "bg-warning-soft text-warning" : r.rank <= 3 ? "bg-brand-soft text-brand-ink" : "text-muted-foreground")}>{r.rank}</span>
                  </td>
                  <td className="px-3 py-3">
                    <Link href={`/app/results/view?attempt=${r.attemptId}`} className="font-medium hover:underline">
                      {r.fullName}
                    </Link>
                    <p className="text-xs text-muted-foreground">{r.email}</p>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <Meter className="w-24" value={r.percent} tone={r.pendingManual ? "warning" : r.passed ? "success" : "danger"} label={`${r.fullName} percent`} />
                      <span className="tabular-nums">{r.percent}%</span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {fmtMarks(r.score)}/{fmtMarks(r.maxScore)}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-end text-muted-foreground tabular-nums">{r.durationMinutes != null ? `${r.durationMinutes} min` : "-"}</td>
                  <td className="px-3 py-3 text-muted-foreground">{fmtDateTime(r.submittedAt)}</td>
                  <td className="px-5 py-3 text-end">
                    {r.pendingManual ? <StatusBadge tone="warning">To grade</StatusBadge> : r.passed ? <StatusBadge tone="success">Pass</StatusBadge> : <StatusBadge tone="danger">Below pass</StatusBadge>}
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">
                    No candidates match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
