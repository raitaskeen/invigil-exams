"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUp, ArrowsClockwise, X } from "@phosphor-icons/react";
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
 * "Invi": a glossy, layered 3D-style robot head. Pure SVG (no image requests): rim-lit shell, glass visor with
 * reflections, glowing eyes that blink, an antenna beacon, and a soft contact shadow. Float + blink via CSS.
 */
export function BotFace({ className, animated = true }: { className?: string; animated?: boolean }) {
  return (
    <svg viewBox="0 0 96 96" className={cn(animated && "bot-float", className)} aria-hidden="true">
      <defs>
        <radialGradient id="invi-shell" cx="34%" cy="26%" r="85%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset=".38" stopColor="#eef2ff" />
          <stop offset=".78" stopColor="#b9c6fb" />
          <stop offset="1" stopColor="#7f8fe6" />
        </radialGradient>
        <linearGradient id="invi-rim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity=".95" />
          <stop offset=".5" stopColor="#a5b4fc" stopOpacity=".2" />
          <stop offset="1" stopColor="#6366f1" stopOpacity=".9" />
        </linearGradient>
        <linearGradient id="invi-visor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1e2a6e" />
          <stop offset=".55" stopColor="#0c1238" />
          <stop offset="1" stopColor="#060a24" />
        </linearGradient>
        <radialGradient id="invi-eye" cx="50%" cy="40%" r="60%">
          <stop offset="0" stopColor="#ecfeff" />
          <stop offset=".45" stopColor="#67e8f9" />
          <stop offset="1" stopColor="#0ea5e9" />
        </radialGradient>
        <radialGradient id="invi-beacon" cx="40%" cy="35%" r="65%">
          <stop offset="0" stopColor="#fdf4ff" />
          <stop offset=".5" stopColor="#c084fc" />
          <stop offset="1" stopColor="#7c3aed" />
        </radialGradient>
        <linearGradient id="invi-ear" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c7d2fe" />
          <stop offset="1" stopColor="#6366f1" />
        </linearGradient>
        <filter id="invi-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.2" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <ellipse cx="48" cy="89" rx="22" ry="3.4" fill="#1e1b4b" opacity=".22" />
      <path d="M48 20v-8" stroke="url(#invi-ear)" strokeWidth="3" strokeLinecap="round" />
      <circle className="bot-beacon" cx="48" cy="9" r="5" fill="url(#invi-beacon)" filter="url(#invi-glow)" />
      <rect x="8" y="40" width="10" height="22" rx="5" fill="url(#invi-ear)" />
      <rect x="78" y="40" width="10" height="22" rx="5" fill="url(#invi-ear)" />
      <rect x="14" y="20" width="68" height="62" rx="26" fill="url(#invi-shell)" />
      <rect x="14.75" y="20.75" width="66.5" height="60.5" rx="25.3" fill="none" stroke="url(#invi-rim)" strokeWidth="1.5" />
      <rect x="22" y="32" width="52" height="34" rx="17" fill="url(#invi-visor)" />
      <rect x="22.5" y="32.5" width="51" height="33" rx="16.5" fill="none" stroke="#818cf8" strokeOpacity=".55" />
      <g filter="url(#invi-glow)">
        <rect className="bot-eye" x="33" y="41" width="9" height="12" rx="4.5" fill="url(#invi-eye)" />
        <rect className="bot-eye" x="54" y="41" width="9" height="12" rx="4.5" fill="url(#invi-eye)" />
      </g>
      <path d="M40.5 58.5q7.5 4 15 0" fill="none" stroke="#67e8f9" strokeWidth="2.4" strokeLinecap="round" opacity=".9" />
      <path d="M27 37c4-3 10-4.5 16-4.5" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="2.5" strokeLinecap="round" />
      <ellipse cx="33" cy="26.5" rx="11" ry="3.6" fill="#fff" opacity=".85" />
      <circle cx="25" cy="70" r="3" fill="#f0abfc" opacity=".45" />
      <circle cx="71" cy="70" r="3" fill="#f0abfc" opacity=".45" />
    </svg>
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
            <header className="flex items-center gap-3 bg-gradient-to-br from-primary to-[oklch(0.45_0.2_275)] px-4 py-3 text-primary-foreground">
              <span className="grid size-11 place-items-center rounded-2xl bg-white/90 shadow-inner">
                <BotFace className="size-9" animated={false} />
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
        className="bot-launcher group fixed end-4 bottom-4 z-40 grid size-[4.25rem] place-items-center rounded-full transition-transform duration-300 ease-[var(--ease-out)] hover:scale-[1.06] active:scale-95 sm:end-6 sm:bottom-6"
      >
        <span className="bot-ring absolute inset-0 rounded-full" aria-hidden="true" />
        <span className="absolute inset-[3px] rounded-full bg-[radial-gradient(circle_at_30%_25%,#ffffff,#e0e7ff_55%,#c7d2fe)] shadow-[inset_0_-6px_14px_rgba(99,102,241,.35),0_14px_34px_-10px_rgba(79,70,229,.65)] dark:bg-[radial-gradient(circle_at_30%_25%,#3b4285,#1e2353_60%,#11143a)]" aria-hidden="true" />
        {open ? <X weight="bold" className="relative size-6 text-indigo-600 dark:text-indigo-200" /> : <BotFace className="relative size-[3.1rem]" />}
        {!open && <span className="absolute end-0.5 top-0.5 flex size-3.5"><span className="absolute inline-flex size-full animate-ping rounded-full bg-success/60" /><span className="relative inline-flex size-3.5 rounded-full bg-success ring-2 ring-background" /></span>}
      </button>
    </>
  );
}
