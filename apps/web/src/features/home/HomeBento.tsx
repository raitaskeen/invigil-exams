"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ChartBar, CloudCheck, Eye, FilePdf, NotePencil, QrCode, SlidersHorizontal, UploadSimple, WifiSlash, type Icon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

interface Tile {
  icon: Icon;
  title: string;
  body: string;
  className?: string;
  visual?: ReactNode;
}

const bar = (w: string, cls = "bg-primary") => <span className={cn("block h-2 rounded-full", cls)} style={{ width: w }} />;

const TILES: Tile[] = [
  {
    icon: WifiSlash,
    title: "Network-aware workspace",
    body: "A save chip and banner say exactly what happened: saved, saving, or kept on this device until the connection returns.",
    className: "md:col-span-2",
    visual: (
      <div className="mt-5 flex flex-wrap gap-2" aria-hidden="true">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-xs font-semibold text-success"><CloudCheck weight="fill" className="size-3.5" /> Saved to server</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-soft px-3 py-1 text-xs font-semibold text-warning"><WifiSlash weight="bold" className="size-3.5" /> No signal · 2 kept locally</span>
      </div>
    ),
  },
  {
    icon: FilePdf,
    title: "PDF reports",
    body: "Result and exam reports generated on the server from real submissions, after access checks.",
  },
  {
    icon: Eye,
    title: "Examiner sandbox",
    body: "Take your own exam as a candidate first. Sandbox attempts never touch results or statistics.",
  },
  {
    icon: UploadSimple,
    title: "Bulk import",
    body: "Questions and candidates from CSV or JSON, with a row-by-row preview and clear errors before anything is saved.",
  },
  {
    icon: ChartBar,
    title: "Question analytics",
    body: "Skipped rate, most common wrong option and observed difficulty for every question.",
    className: "md:col-span-2",
    visual: (
      <div className="mt-5 grid gap-2" aria-hidden="true">
        {[["Q3 · Joins", "78%", "bg-success"], ["Q7 · Indexes", "41%", "bg-warning"], ["Q9 · Isolation", "23%", "bg-danger"]].map(([l, w, c]) => (
          <div key={l} className="flex items-center gap-3 text-xs">
            <span className="w-24 shrink-0 text-muted-foreground">{l}</span>
            <span className="flex-1 rounded-full bg-muted">{bar(w!, c)}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: QrCode,
    title: "Verifiable results",
    body: "Every report carries a code and QR anyone can check, with the name masked.",
  },
  {
    icon: SlidersHorizontal,
    className: "md:col-span-2",
    title: "Your workspace, your way",
    body: "Text size, one-at-a-time or all-on-one-page, high contrast and dark mode, remembered on the device.",
  },
  {
    icon: NotePencil,
    className: "md:col-span-2",
    title: "Digital scratchpad",
    body: "Notes and a sketch canvas beside the paper, saved with the attempt and never marked.",
  },
];

export function BentoFeatures() {
  const reduce = useReducedMotion();
  return (
    <section id="features" aria-labelledby="features-title" className="scroll-mt-24 px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-primary">Everything an exam needs</p>
          <h2 id="features-title" className="mt-3 text-[clamp(2rem,4.2vw,3.1rem)] leading-[1.02] font-semibold tracking-[-0.045em] text-balance">
            Built for the whole exam, not just the questions.
          </h2>
        </div>
        <ul className="mt-12 grid gap-4 md:grid-cols-4">
          {TILES.map((t, i) => (
            <motion.li
              key={t.title}
              initial={reduce ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, ease: EASE, delay: (i % 4) * 0.06 }}
              className={cn(
                "group relative overflow-hidden rounded-[1.5rem] border border-border bg-card p-6 shadow-xs transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg",
                t.className,
              )}
            >
              <span className="pointer-events-none absolute -top-16 -right-16 size-40 rounded-full bg-primary/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" aria-hidden="true" />
              <span className="grid size-11 place-items-center rounded-2xl bg-brand-soft text-brand-ink transition-transform duration-300 group-hover:scale-110">
                <t.icon weight="duotone" className="size-6" aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-lg font-semibold tracking-[-0.02em]">{t.title}</h3>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-foreground-soft">{t.body}</p>
              {t.visual}
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
