"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUp, ArrowsClockwise, Sparkle, X } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/features/app/Assistant";
import { api, apiErrorMessage } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

interface Msg {
  role: "user" | "assistant";
  content: string;
  error?: boolean;
}

/**
 * Invi's mark: a small aurora orb in the brand colours (a slowly turning conic gradient, softened, under a glass
 * highlight) with a crisp sparkle on top. Abstract on purpose - it reads as "assistant" without a mascot.
 */
export function InviOrb({ className, still = false }: { className?: string; still?: boolean }) {
  return (
    <span className={cn("relative isolate grid place-items-center overflow-hidden rounded-full bg-[oklch(0.16_0.04_var(--brand-h))]", className)} aria-hidden="true">
      <span className={cn("invi-aurora absolute -inset-1 rounded-full", still && "[animation:none]")} />
      <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_32%_26%,rgb(255_255_255/0.55),transparent_42%)]" />
      <span className="absolute inset-0 rounded-full shadow-[inset_0_0_0_1px_rgb(255_255_255/0.25),inset_0_-8px_16px_oklch(0.2_0.08_var(--brand-h)/0.55)]" />
      <Sparkle weight="fill" className="relative size-[42%] text-white drop-shadow-[0_1px_4px_rgb(0_0_0/0.35)]" />
    </span>
  );
}

const ROLE_LABEL = { guest: "Visitor", candidate: "Candidate", examiner: "Examiner", admin: "Admin" } as const;

/**
 * Floating help bot (bottom-right on every page except the exam workspace, where nothing should distract).
 * Answers come from /api/ai/help: a built-in, role-aware platform guide - no API key ever reaches the browser.
 */
export function HelpBot() {
  const pathname = usePathname();
  const { user } = useAuth();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const meta = useQuery({
    queryKey: ["help-suggestions", user?.id ?? 0],
    queryFn: () => api<{ role: keyof typeof ROLE_LABEL; suggestions: string[] }>("/ai/help/suggestions"),
    enabled: open,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => inputRef.current?.focus(), 80);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(id);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (pathname?.startsWith("/exam")) return null;

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    const history = [...messages.filter((m) => !m.error), { role: "user" as const, content }];
    setMessages(history);
    setInput("");
    setBusy(true);
    try {
      const res = await api<{ answer: string }>("/ai/help", { method: "POST", json: { messages: history.slice(-8).map(({ role, content: c }) => ({ role, content: c.slice(0, 1000) })) } });
      setMessages((all) => [...all, { role: "assistant", content: res.answer }]);
    } catch (err) {
      setMessages((all) => [...all, { role: "assistant", content: apiErrorMessage(err, "I couldn't answer just now. Please try again."), error: true }]);
    } finally {
      setBusy(false);
    }
  }

  const first = user?.fullName?.split(" ")[0];
  const role = meta.data?.role ?? (user ? "candidate" : "guest");

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.section
            role="dialog"
            aria-label="Invigil help"
            initial={reduce ? false : { opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-3 bottom-24 z-40 flex max-h-[min(36rem,calc(100dvh-8rem))] flex-col overflow-hidden rounded-[1.5rem] border border-border-strong bg-popover shadow-2xl sm:inset-x-auto sm:end-5 sm:w-[23rem]"
          >
            <header className="flex items-center gap-3 bot-header px-4 py-3 text-primary-foreground">
              <span className="grid size-11 place-items-center rounded-2xl bg-white/90 shadow-inner">
                <InviOrb className="size-9" still />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-[0.9375rem] leading-tight font-semibold">Invi · Help</h2>
                <p className="truncate text-xs text-white/80">Help for {ROLE_LABEL[role]}s · answers from the platform guide</p>
              </div>
              {messages.length > 0 && (
                <Button variant="ghost" size="icon-sm" className="text-white hover:bg-white/15 hover:text-white" aria-label="New conversation" onClick={() => setMessages([])}>
                  <ArrowsClockwise />
                </Button>
              )}
              <Button variant="ghost" size="icon-sm" className="text-white hover:bg-white/15 hover:text-white" aria-label="Close help" onClick={() => setOpen(false)}>
                <X />
              </Button>
            </header>

            <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4" aria-live="polite">
              <div className="rounded-2xl rounded-ss-md bg-muted px-3.5 py-2.5 text-sm text-foreground-soft">
                Hi{first ? ` ${first}` : ""}! I&apos;m <b className="text-foreground">Invi</b>. Ask me how anything on Invigil works
                {role === "examiner" ? " - building exams, enrolment, monitoring, grading or rankings." : role === "admin" ? " - users, roles, password resets or feedback." : " - signing in, exams, connection drops, results or practice."}
              </div>
              {messages.length === 0 && (
                <ul className="flex flex-wrap gap-2" aria-label="Suggested questions">
                  {(meta.data?.suggestions ?? []).map((s) => (
                    <li key={s}>
                      <button type="button" onClick={() => send(s)} className="rounded-full border border-border bg-surface px-3 py-1.5 text-start text-xs font-medium text-foreground-soft transition-colors hover:border-primary/50 hover:text-foreground">
                        {s}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {messages.map((m, i) =>
                m.role === "user" ? (
                  <div key={i} className="ms-auto w-fit max-w-[85%] rounded-2xl rounded-ee-md bg-primary px-3.5 py-2 text-sm text-primary-foreground">{m.content}</div>
                ) : (
                  <div key={i} className={cn("max-w-[92%] rounded-2xl rounded-ss-md px-3.5 py-2 text-sm leading-relaxed", m.error ? "bg-danger-soft text-danger" : "bg-muted text-foreground-soft")}>
                    <Markdown text={m.content} onNavigate={() => setOpen(false)} />
                  </div>
                ),
              )}
              {busy && (
                <div className="flex w-fit gap-1 rounded-2xl bg-muted px-3.5 py-3" aria-label="Invi is typing">
                  {[0, 1, 2].map((d) => (
                    <span key={d} className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60" style={{ animationDelay: `${d * 120}ms` }} />
                  ))}
                </div>
              )}
            </div>

            <form
              className="border-t border-border p-2.5"
              onSubmit={(e) => {
                e.preventDefault();
                void send(input);
              }}
            >
              <div className="flex items-end gap-2 rounded-2xl border border-control-border/70 bg-surface p-1.5 focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/20">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  maxLength={1000}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      void send(input);
                    }
                  }}
                  placeholder="Ask a question..."
                  aria-label="Ask Invi a question"
                  className="field-sizing-content max-h-28 min-h-9 flex-1 resize-none bg-transparent px-2 py-1.5 text-base outline-none placeholder:text-muted-foreground sm:text-sm"
                />
                <Button type="submit" size="icon-sm" aria-label="Send" disabled={!input.trim() || busy}>
                  <ArrowUp weight="bold" />
                </Button>
              </div>
            </form>
          </motion.section>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? "Close help" : "Open help chat"}
        className="invi-launcher group fixed end-4 bottom-4 z-40 flex h-14 items-center gap-0 rounded-full border border-white/10 bg-[oklch(0.17_0.03_var(--brand-h)/0.92)] p-1.5 text-white shadow-[0_18px_40px_-12px_oklch(0.25_0.12_var(--brand-h)/0.7)] backdrop-blur-xl transition-[gap,padding,transform] duration-300 ease-[var(--ease-out)] hover:gap-2.5 hover:pe-4 focus-visible:gap-2.5 focus-visible:pe-4 active:scale-95 sm:end-6 sm:bottom-6"
      >
        {open ? (
          <span className="grid size-11 place-items-center rounded-full bg-white/10"><X weight="bold" className="size-5" aria-hidden="true" /></span>
        ) : (
          <InviOrb className="size-11" />
        )}
        <span className="max-w-0 overflow-hidden text-sm font-semibold whitespace-nowrap opacity-0 transition-[max-width,opacity] duration-300 group-hover:max-w-24 group-hover:opacity-100 group-focus-visible:max-w-24 group-focus-visible:opacity-100">
          {open ? "Close" : "Ask Invi"}
        </span>
      </button>
    </>
  );
}
