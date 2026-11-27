"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DownloadSimple, Eye, FileText, LinkSimple, MagnifyingGlass, Trash, UploadSimple } from "@phosphor-icons/react";
import { MAX_PAPER_BYTES, PAPER_TYPES, pastPaperSchema, type PastPaperInput } from "@np/shared";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { EmptyState, ErrorState, LoadingRows } from "@/components/feedback/States";
import { FormField, inputCls, selectCls, textareaCls } from "@/components/form/FormField";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api, apiErrorMessage, ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

interface Paper {
  id: number;
  title: string;
  subject: string;
  year: number;
  examType: (typeof PAPER_TYPES)[number];
  description: string;
  fileName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  url: string | null;
  createdAt: string;
  uploadedBy: number;
  uploaderName: string;
}
interface PaperList {
  items: Paper[];
  subjects: string[];
  years: number[];
}

const TYPE_LABEL: Record<Paper["examType"], string> = { midterm: "Midterm", final: "Final", quiz: "Quiz", entrance: "Entrance", other: "Other" };
const kb = (n: number | null) => (n == null ? "" : n < 1024 ? `${n} B` : `${Math.round(n / 1024)} KB`);

export function PapersPage() {
  const { can, user } = useAuth();
  const qc = useQueryClient();
  const [filters, setFilters] = useState({ q: "", subject: "", year: "", examType: "" });
  const qs = useMemo(() => new URLSearchParams(Object.entries(filters).filter(([, v]) => v)).toString(), [filters]);
  const list = useQuery({ queryKey: ["papers", qs], queryFn: () => api<PaperList>(`/papers${qs ? `?${qs}` : ""}`), placeholderData: (prev) => prev });
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState<Paper | null>(null);
  const canUpload = can("exams:manage");
  const remove = useMutation({
    mutationFn: (id: number) => api(`/papers/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Paper removed");
      setRemoving(null);
      qc.invalidateQueries({ queryKey: ["papers"] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const set = (k: keyof typeof filters) => (e: { target: { value: string } }) => setFilters((f) => ({ ...f, [k]: e.target.value }));
  const any = Object.values(filters).some(Boolean);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Past papers"
        description="Previous years' papers uploaded by your examiners. Filter by subject, year and type, then view or download."
        actions={canUpload && <Button onClick={() => setUploading(true)}><UploadSimple /> Upload paper</Button>}
      />
      <div className="grid gap-2 rounded-[var(--radius-card)] border border-border bg-card p-3 shadow-xs sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]">
        <label className="relative">
          <span className="sr-only">Search papers</span>
          <MagnifyingGlass className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input value={filters.q} onChange={set("q")} placeholder="Search title or description" className={cn(inputCls, "ps-9")} />
        </label>
        <select aria-label="Subject" value={filters.subject} onChange={set("subject")} className={selectCls}>
          <option value="">All subjects</option>
          {list.data?.subjects.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select aria-label="Year" value={filters.year} onChange={set("year")} className={selectCls}>
          <option value="">All years</option>
          {list.data?.years.map((y) => <option key={y}>{y}</option>)}
        </select>
        <select aria-label="Exam type" value={filters.examType} onChange={set("examType")} className={selectCls}>
          <option value="">All types</option>
          {PAPER_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
        </select>
        <Button variant="ghost" disabled={!any} onClick={() => setFilters({ q: "", subject: "", year: "", examType: "" })}>Clear</Button>
      </div>

      {list.isLoading ? (
        <LoadingRows rows={4} />
      ) : list.error ? (
        <ErrorState title="Couldn't load papers" onRetry={() => list.refetch()} />
      ) : !list.data?.items.length ? (
        <EmptyState title={any ? "No papers match these filters" : "No past papers yet"} description={any ? "Try a different subject or year." : canUpload ? "Upload the first one." : "Your examiners haven't uploaded any yet."} />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {list.data.items.map((p, i) => (
            <li key={p.id} className="group flex flex-col rounded-[var(--radius-card)] border border-border bg-card p-4 shadow-xs transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md animate-[rise_400ms_var(--ease-out)_backwards]" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
              <div className="flex items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-ink">
                  {p.fileName ? <FileText weight="duotone" className="size-6" aria-hidden="true" /> : <LinkSimple weight="duotone" className="size-6" aria-hidden="true" />}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="leading-snug font-semibold">{p.title}</h2>
                  <p className="mt-1 flex flex-wrap gap-1.5 text-xs">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-foreground-soft">{p.subject}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-foreground-soft tabular-nums">{p.year}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-foreground-soft">{TYPE_LABEL[p.examType]}</span>
                  </p>
                </div>
              </div>
              {p.description && <p className="mt-3 line-clamp-2 text-sm text-foreground-soft">{p.description}</p>}
              <p className="mt-3 text-xs text-muted-foreground">Uploaded by {p.uploaderName}{p.sizeBytes ? ` · ${kb(p.sizeBytes)}` : ""}</p>
              <div className="mt-auto flex gap-2 pt-4">
                <Button size="sm" variant="outline" className="flex-1" render={<a href={`/api/papers/${p.id}/file`} target="_blank" rel="noopener" />}>
                  <Eye /> View
                </Button>
                {p.fileName && (
                  <Button size="sm" className="flex-1" render={<a href={`/api/papers/${p.id}/file?download=1`} download={p.fileName} />}>
                    <DownloadSimple /> Download
                  </Button>
                )}
                {canUpload && (p.uploadedBy === user?.id || can("platform:admin")) && (
                  <Button size="icon-sm" variant="ghost" aria-label={`Remove ${p.title}`} onClick={() => setRemoving(p)}>
                    <Trash />
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {canUpload && <UploadDialog open={uploading} onOpenChange={setUploading} subjects={list.data?.subjects ?? []} />}
      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(null)}
        title="Remove this paper?"
        description={removing ? `"${removing.title}" will no longer be available to candidates.` : ""}
        confirmLabel="Remove"
        destructive
        onConfirm={() => { if (removing) remove.mutate(removing.id); }}
      />
    </div>
  );
}

function readBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = () => reject(new Error("Couldn't read the file"));
    r.readAsDataURL(file);
  });
}

function UploadDialog({ open, onOpenChange, subjects }: { open: boolean; onOpenChange: (o: boolean) => void; subjects: string[] }) {
  const qc = useQueryClient();
  const blank = { title: "", subject: "", year: String(new Date().getFullYear() - 1), examType: "final", description: "", url: "" };
  const [v, setV] = useState(blank);
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function submit() {
    setErrors({});
    if (file && file.size > MAX_PAPER_BYTES) return setErrors({ file: "File is larger than 600 KB. Use a link instead." });
    setBusy(true);
    try {
      const body = {
        ...v,
        url: v.url.trim() || null,
        file: file ? { name: file.name, mimeType: file.type, base64: await readBase64(file) } : null,
      };
      const parsed = pastPaperSchema.safeParse(body);
      if (!parsed.success) {
        const f: Record<string, string> = {};
        for (const i of parsed.error.issues) f[String(i.path[0] ?? "_")] ??= i.message;
        setErrors(f);
        return;
      }
      await api("/papers", { method: "POST", json: parsed.data satisfies PastPaperInput });
      toast.success("Paper uploaded");
      qc.invalidateQueries({ queryKey: ["papers"] });
      setV(blank);
      setFile(null);
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fields).length) setErrors(err.fields);
      else toast.error(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const field = (k: keyof typeof v) => ({ value: v[k], onChange: (e: { target: { value: string } }) => setV((s) => ({ ...s, [k]: e.target.value })) });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload a past paper</DialogTitle>
          <DialogDescription>PDF, PNG, JPEG or text up to 600 KB, or a link to where the paper is hosted.</DialogDescription>
        </DialogHeader>
        <form
          id="paper-form"
          className="grid gap-4"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <FormField label="Title" required error={errors.title}>{(p) => <input {...p} {...field("title")} className={inputCls} placeholder="CS-201 Data Structures · Final" />}</FormField>
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField label="Subject" required error={errors.subject} className="sm:col-span-1">
              {(p) => (
                <>
                  <input {...p} {...field("subject")} list="paper-subjects" className={inputCls} placeholder="Databases" />
                  <datalist id="paper-subjects">{subjects.map((s) => <option key={s} value={s} />)}</datalist>
                </>
              )}
            </FormField>
            <FormField label="Year" required error={errors.year}>{(p) => <input {...p} {...field("year")} inputMode="numeric" className={inputCls} />}</FormField>
            <FormField label="Type" error={errors.examType}>
              {(p) => (
                <select {...p} {...field("examType")} className={selectCls}>
                  {PAPER_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
                </select>
              )}
            </FormField>
          </div>
          <FormField label="Description" error={errors.description}>{(p) => <textarea {...p} {...field("description")} className={textareaCls} rows={2} />}</FormField>
          <FormField label="File" error={errors.file} hint={file ? `${file.name} · ${kb(file.size)}` : "Optional if you give a link"}>
            {(p) => <input {...p} type="file" accept=".pdf,.png,.jpg,.jpeg,.txt,application/pdf,image/png,image/jpeg,text/plain" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className={cn(inputCls, "py-2 file:me-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1 file:text-sm")} />}
          </FormField>
          <FormField label="Or a link" error={errors.url}>{(p) => <input {...p} {...field("url")} type="url" className={inputCls} placeholder="https://..." />}</FormField>
        </form>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form="paper-form" disabled={busy}>{busy ? "Uploading..." : "Upload"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
