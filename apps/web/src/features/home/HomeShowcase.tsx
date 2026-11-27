"use client";

import { useRef, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { CheckCircle } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;
const img = (id: string, w: number) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=75`;

/** Photo with a gentle scroll parallax and a live overlay that demonstrates the feature. */
function Stage({ photo, alt, children, flip }: { photo: string; alt: string; children?: ReactNode; flip?: boolean }) {
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
      <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.15_0.03_var(--brand-h)/0.35)] via-transparent to-transparent" />
      {children}
    </motion.div>
  );
}

const GLOW = ["oklch(0.7 0.14 210 / 0.45)", "oklch(0.72 0.15 75 / 0.4)", "oklch(0.62 0.18 290 / 0.4)"];

const ROWS = [
  {
    id: "resilience",
    kicker: "Failure-resilient",
    title: "The Wi-Fi drops. The exam doesn't.",
    body: "Answers are kept on the device the moment the connection fails, retried with backoff and synced on reconnect. The server owns the clock, so nobody gains or loses a second.",
    points: ["Saves every answer as you go", "Refresh or switch device - same question, same time left", "Finalised with what the server accepted before the deadline"],
    photo: "photo-1513258496099-48168024aec0",
    alt: "A student with headphones working on a laptop",
  },
  {
    id: "fairness",
    kicker: "Fair by construction",
    title: "Different papers. Equal difficulty.",
    body: "Each candidate draws the same number of easy, medium and hard questions from a larger pool. Publishing is blocked unless every possible paper carries the same marks.",
    points: ["Stratified random draw per difficulty", "Shuffled options, marking follows the option", "Paper snapshot fixed for the whole attempt"],
    photo: "photo-1580582932707-520aed937b7b",
    alt: "An empty classroom with rows of desks",
  },
  {
    id: "monitoring",
    kicker: "For examiners",
    title: "See every exam as it happens.",
    body: "Progress, online status and neutral integrity signals per candidate in real time. Announce, extend time with a recorded reason, then grade and publish from the same place.",
    points: ["Live updates over WebSockets", "Signals are never treated as proof", "Ranked results, analytics and PDF reports"],
    photo: "photo-1758270705317-3ef6142d306f",
    alt: "A group of students gathered around a laptop",
  },
];

export function Showcase() {
  const reduce = useReducedMotion();
  return (
    <div className="px-4 sm:px-6">
      {ROWS.map((r, i) => (
        <section key={r.id} id={r.id} aria-labelledby={`${r.id}-title`} className="mx-auto grid max-w-6xl scroll-mt-24 items-center gap-10 py-16 sm:py-24 lg:grid-cols-2 lg:gap-16">
          <div className={cn("relative", i % 2 && "lg:order-2")}>
            <div className="pointer-events-none absolute -inset-8 -z-10 rounded-[3rem] opacity-70 blur-3xl" style={{ background: `radial-gradient(closest-side, ${GLOW[i % GLOW.length]}, transparent)` }} aria-hidden="true" />
            <Stage photo={r.photo} alt={r.alt} flip={i % 2 === 1}>

            </Stage>
          </div>
          <motion.div initial={reduce ? false : { opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}>
            <h2 id={`${r.id}-title`} className="text-[clamp(2rem,4.2vw,3.1rem)] leading-[1.02] font-semibold tracking-[-0.045em] text-balance">{r.title}</h2>
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
    </div>
  );
}
