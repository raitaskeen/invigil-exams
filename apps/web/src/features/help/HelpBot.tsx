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

/** A small, friendly 3D-looking robot head: gradient shading, a gentle float and a periodic blink. */
export function BotFace({ className, animated = true }: { className?: string; animated?: boolean }) {
  return (
    <svg viewBox="0 0 64 64" className={cn(animated && "bot-float", className)} aria-hidden="true">
      <defs>
        <radialGradient id="bot-head" cx="35%" cy="28%" r="80%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset=".55" stopColor="#dfe7ff" />
          <stop offset="1" stopColor="#9fb3f5" />
        </radialGradient>
        <linearGradient id="bot-visor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1f2a5c" />
          <stop offset="1" stopColor="#0d1433" />
        </linearGradient>
        <radialGradient id="bot-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#7cf3ff" />
          <stop offset="1" stopColor="#3aa8ff" />
        </radialGradient>
      </defs>
      <ellipse cx="32" cy="59" rx="15" ry="2.6" fill="#0b1230" opacity=".18" />
      <line x1="32" y1="9" x2="32" y2="15" stroke="#8ea2e8" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="32" cy="7.5" r="3.4" fill="url(#bot-glow)" />
      <rect x="7" y="27" width="6" height="13" rx="3" fill="#8ea2e8" />
      <rect x="51" y="27" width="6" height="13" rx="3" fill="#8ea2e8" />
      <rect x="10" y="14" width="44" height="38" rx="15" fill="url(#bot-head)" stroke="#8ea2e8" strokeWidth="1.2" />
      <rect x="16" y="22" width="32" height="20" rx="10" fill="url(#bot-visor)" />
      <ellipse className="bot-eye" cx="25.5" cy="31.5" rx="3.2" ry="3.8" fill="url(#bot-glow)" />
      <ellipse className="bot-eye" cx="38.5" cy="31.5" rx="3.2" ry="3.8" fill="url(#bot-glow)" />
      <path d="M27.5 37.2q4.5 3 9 0" fill="none" stroke="#7cf3ff" strokeWidth="1.8" strokeLinecap="round" />
      <ellipse cx="22" cy="19.5" rx="6" ry="2.2" fill="#fff" opacity=".7" />
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
              <span className="grid size-10 place-items-center rounded-2xl bg-white/15">
                <BotFace className="size-8" animated={false} />
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
        className="group fixed end-4 bottom-4 z-40 grid size-16 place-items-center rounded-full bg-gradient-to-br from-[oklch(0.97_0.02_265)] to-[oklch(0.86_0.06_265)] shadow-[0_10px_30px_-8px_oklch(0.4_0.15_265/0.55)] ring-1 ring-black/5 transition-transform duration-300 hover:scale-105 active:scale-95 sm:end-5 sm:bottom-5"
      >
        {open ? <X weight="bold" className="size-6 text-[oklch(0.35_0.12_265)]" /> : <BotFace className="size-12" />}
        {!open && <span className="absolute end-1 top-1 size-3 rounded-full bg-success ring-2 ring-background" aria-hidden="true" />}
      </button>
    </>
  );
}
