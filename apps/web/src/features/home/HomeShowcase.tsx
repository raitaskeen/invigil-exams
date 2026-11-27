"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ArrowsClockwise, CheckCircle, CloudCheck, CloudSlash, Pulse, Scales, WifiHigh } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;
const img = (id: string, w: number) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=75`;

/** Photo with a gentle scroll parallax and a live overlay that demonstrates the feature. */
function Stage({ photo, alt, children, flip }: { photo: string; alt: string; children: ReactNode; flip?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-6%", "6%"]);
  return (
    <motion.div
      ref={ref}
      initial={reduce ? false : { opacity: 0, y: 40, rotate: flip ? 1.5 : -1.5 }}
      whileInView={{ opacity: 1, y: 0, rotate: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.9, ease: EASE }}
      className="relative aspect-[5/4] overflow-hidden rounded-[2rem] bg-muted shadow-[0_40px_80px_-40px_oklch(0.25_0.08_var(--brand-h)/0.55)]"
    >
      <motion.img style={{ y, scale: 1.14 }} src={img(photo, 1200)} srcSet={`${img(photo, 700)} 700w, ${img(photo, 1200)} 1200w`} sizes="(min-width: 1024px) 50vw, 100vw" alt={alt} loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.15_0.03_var(--brand-h)/0.75)] via-transparent to-transparent" />
      <div className="absolute inset-x-4 bottom-4 sm:inset-x-6 sm:bottom-6">{children}</div>
    </motion.div>
  );
}

function Glass({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-2xl border border-white/20 bg-white/80 p-4 text-[oklch(0.2_0.02_var(--brand-h))] shadow-xl backdrop-blur-xl dark:bg-[oklch(0.2_0.02_var(--brand-h)/0.8)] dark:text-white", className)}>{children}</div>;
}

// ---- Live demo 1: drop the connection yourself -------------------------------------------------------------
type Net = "online" | "offline" | "syncing";
const NET: Record<Net, { icon: typeof CloudCheck; cls: string }> = {
  online: { icon: CloudCheck, cls: "bg-success-soft text-success" },
  offline: { icon: CloudSlash, cls: "bg-warning-soft text-warning" },
  syncing: { icon: ArrowsClockwise, cls: "bg-brand-soft text-brand-ink" },
};

function useCycle(n: number, ms: number) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), ms);
    return () => clearInterval(t);
  }, [n, ms, reduce]);
  return i;
}

/** Interactive: press the button, watch answers queue on the device, then sync when the connection returns. */
function NetworkDemo() {
  const [net, setNet] = useState<Net>("online");
  const [saved, setSaved] = useState(3);
  const [queued, setQueued] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms));

  function drop() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setNet("offline");
    setSaved(3);
    setQueued(0);
    later(700, () => setQueued(1));
    later(1400, () => setQueued(2));
    later(2600, () => setNet("syncing"));
    later(3600, () => {
      setNet("online");
      setSaved(5);
      setQueued(0);
    });
  }

  const s = NET[net];
  const text = net === "online" ? "All answers saved" : net === "offline" ? `Offline · ${queued} answer${queued === 1 ? "" : "s"} kept on this device` : "Back online · syncing";
  return (
    <Glass>
      <div className="flex items-center justify-between gap-3">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={net + queued} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: EASE }} className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold", s.cls)} role="status">
            <s.icon weight="bold" className={cn("size-3.5", net === "syncing" && "animate-spin")} aria-hidden="true" /> {text}
          </motion.span>
        </AnimatePresence>
        <button
          type="button"
          onClick={drop}
          disabled={net !== "online"}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[oklch(0.2_0.02_var(--brand-h))] px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40 dark:bg-white dark:text-[oklch(0.2_0.02_var(--brand-h))]"
        >
          {net === "offline" ? <CloudSlash className="size-3.5" aria-hidden="true" /> : <WifiHigh className="size-3.5" aria-hidden="true" />} Drop the connection
        </button>
      </div>
      <div className="mt-3 grid grid-cols-6 gap-1.5" aria-hidden="true">
        {Array.from({ length: 6 }, (_, q) => {
          const isSaved = q < saved;
          const isQueued = !isSaved && q < saved + queued;
          return (
            <div key={q} className="h-1.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/15">
              <motion.div className={cn("h-full rounded-full", isSaved ? "bg-success" : "bg-warning")} initial={false} animate={{ width: isSaved || isQueued ? "100%" : "0%" }} transition={{ duration: 0.45, ease: EASE }} />
            </div>
          );
        })}
      </div>
    </Glass>
  );
}

// ---- Live demo 2: three different papers, identical difficulty -------------------------------------------
const MIX = [
  { label: "Easy", n: 3, cls: "bg-success" },
  { label: "Medium", n: 2, cls: "bg-warning" },
  { label: "Hard", n: 1, cls: "bg-danger" },
];

function FairnessDemo() {
  const round = useCycle(1000, 2600);
  return (
    <Glass>
      <div className="grid grid-cols-3 gap-2">
        {["A", "B", "C"].map((c, ci) => (
          <div key={c} className="rounded-xl bg-black/[0.04] p-2.5 dark:bg-white/10">
            <p className="text-[0.6875rem] font-semibold">Paper {c}</p>
            <div className="mt-2 flex gap-1">
              {MIX.flatMap((m) => Array.from({ length: m.n }, (_, k) => ({ ...m, k }))).map((m, j) => (
                <motion.span key={`${round}-${j}`} initial={{ scaleY: 0.2, opacity: 0 }} animate={{ scaleY: 1, opacity: 1 }} transition={{ delay: ci * 0.08 + j * 0.04, duration: 0.4, ease: EASE }} className={cn("h-5 flex-1 origin-bottom rounded-sm", m.cls)} />
              ))}
            </div>
            <p className="mt-2 font-mono text-[0.625rem] opacity-70">Q{((round * 7 + ci * 5) % 9) + 1} · Q{((round * 3 + ci * 2) % 9) + 1} · …</p>
          </div>
        ))}
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-xs font-medium"><Scales weight="bold" className="size-3.5 text-primary" aria-hidden="true" /> Different questions · same 3/2/1 mix · same 17 marks</p>
    </Glass>
  );
}

// ---- Live demo 3: live monitoring ------------------------------------------------------------------------------
function MonitorDemo() {
  const t = useCycle(1000, 1400);
  const rows = [
    { n: "Candidate 1", base: 3 },
    { n: "Candidate 2", base: 5 },
    { n: "Candidate 3", base: 1 },
  ];
  return (
    <Glass>
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className="inline-flex items-center gap-1.5"><span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" /><span className="relative inline-flex size-2 rounded-full bg-success" /></span> Live · Databases Quiz</span>
        <Pulse className="size-4 text-primary" aria-hidden="true" />
      </div>
      <ul className="mt-3 space-y-2">
        {rows.map((r, i) => {
          const done = Math.min(6, r.base + ((t + i) % 3));
          return (
            <li key={r.n} className="flex items-center gap-3 text-xs">
              <span className="w-20 shrink-0 opacity-80">{r.n}</span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/15">
                <motion.span className="block h-full rounded-full bg-primary" animate={{ width: `${(done / 6) * 100}%` }} transition={{ duration: 0.6, ease: EASE }} />
              </span>
              <span className="w-8 text-end tabular-nums">{done}/6</span>
            </li>
          );
        })}
      </ul>
    </Glass>
  );
}

const ROWS = [
  {
    id: "resilience",
    kicker: "Failure-resilient",
    title: "The Wi-Fi drops. The exam doesn't.",
    body: "Answers are kept on the device the moment the connection fails, retried with backoff and synced on reconnect. The server owns the clock, so nobody gains or loses a second.",
    points: ["Saves every answer as you go", "Refresh or switch device - same question, same time left", "Finalised with what the server accepted before the deadline"],
    photo: "photo-1513258496099-48168024aec0",
    alt: "A student with headphones working on a laptop",
    demo: <NetworkDemo />,
  },
  {
    id: "fairness",
    kicker: "Fair by construction",
    title: "Different papers. Equal difficulty.",
    body: "Each candidate draws the same number of easy, medium and hard questions from a larger pool. Publishing is blocked unless every possible paper carries the same marks.",
    points: ["Stratified random draw per difficulty", "Shuffled options, marking follows the option", "Paper snapshot fixed for the whole attempt"],
    photo: "photo-1580582932707-520aed937b7b",
    alt: "An empty classroom with rows of desks",
    demo: <FairnessDemo />,
  },
  {
    id: "monitoring",
    kicker: "For examiners",
    title: "See every exam as it happens.",
    body: "Progress, online status and neutral integrity signals per candidate in real time. Announce, extend time with a recorded reason, then grade and publish from the same place.",
    points: ["Live updates over WebSockets", "Signals are never treated as proof", "Ranked results, analytics and PDF reports"],
    photo: "photo-1758270705317-3ef6142d306f",
    alt: "A group of students gathered around a laptop",
    demo: <MonitorDemo />,
  },
];

export function Showcase() {
  const reduce = useReducedMotion();
  return (
    <div className="px-4 sm:px-6">
      {ROWS.map((r, i) => (
        <section key={r.id} id={r.id} aria-labelledby={`${r.id}-title`} className="mx-auto grid max-w-6xl scroll-mt-24 items-center gap-10 py-16 sm:py-24 lg:grid-cols-2 lg:gap-16">
          <div className={cn(i % 2 && "lg:order-2")}>
            <Stage photo={r.photo} alt={r.alt} flip={i % 2 === 1}>
              {r.demo}
            </Stage>
          </div>
          <motion.div initial={reduce ? false : { opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}>
            <p className="text-sm font-semibold text-primary">{r.kicker}</p>
            <h2 id={`${r.id}-title`} className="mt-3 text-[clamp(2rem,4.2vw,3.1rem)] leading-[1.02] font-semibold tracking-[-0.045em] text-balance">{r.title}</h2>
            <p className="mt-5 text-lg leading-relaxed text-foreground-soft">{r.body}</p>
            <ul className="mt-7 space-y-3">
              {r.points.map((p) => (
                <li key={p} className="flex items-start gap-3 text-[0.9375rem]">
                  <CheckCircle weight="fill" className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" /> {p}
                </li>
              ))}
            </ul>
          </motion.div>
        </section>
      ))}
      <p className="mx-auto max-w-6xl text-end text-[0.6875rem] text-muted-foreground">Photos: Unsplash</p>
    </div>
  );
}
