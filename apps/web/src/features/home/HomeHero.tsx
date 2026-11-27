"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle, CloudCheck, Flag, Pulse, SealCheck, ShieldCheck, Timer } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

const PHOTO = "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=2200&q=70";

/** Ticks once mounted; the first render is static so server and client HTML match. */
function useCountdown(start: number) {
  const [s, setS] = useState(start);
  useEffect(() => {
    const t = setInterval(() => setS((x) => (x > 0 ? x - 1 : start)), 1000);
    return () => clearInterval(t);
  }, [start]);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

const NAV = ["done", "done", "done", "flag", "now", "todo", "todo", "done", "todo", "todo"] as const;

function ProductPreview() {
  const time = useCountdown(27 * 60 + 14);
  return (
    <div className="relative mx-auto w-full max-w-[30rem]">
      <div className="hero-card relative rounded-[1.75rem] border border-white/15 bg-white/[0.96] p-5 text-[oklch(0.2_0.02_var(--brand-h))] shadow-[0_40px_100px_-30px_oklch(0.1_0.05_var(--brand-h)/0.8)] sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">CS-301 Databases · Quiz 3</p>
            <p className="text-xs text-[oklch(0.5_0.02_var(--brand-h))]">Question 5 of 10 · 3 marks</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[oklch(0.2_0.02_var(--brand-h))] px-3 py-1.5 font-mono text-sm font-semibold text-white tabular-nums">
            <Timer weight="bold" className="size-4" aria-hidden="true" />
            <span aria-label="Time remaining">{time}</span>
          </span>
        </div>
        <p className="mt-4 text-[0.9375rem] leading-snug font-medium">Which isolation level prevents dirty reads but still allows non-repeatable reads?</p>
        <ul className="mt-3 space-y-2" aria-hidden="true">
          {["Read uncommitted", "Read committed", "Repeatable read"].map((o, i) => (
            <li key={o} className={cn("flex items-center gap-2.5 rounded-xl border px-3 py-2 text-sm", i === 1 ? "border-primary bg-brand-soft font-medium text-brand-ink" : "border-[oklch(0.9_0.01_var(--brand-h))]")}>
              <span className={cn("grid size-5 place-items-center rounded-full border text-[0.625rem] font-semibold", i === 1 ? "border-primary bg-primary text-primary-foreground" : "border-[oklch(0.85_0.01_var(--brand-h))]")}>{String.fromCharCode(65 + i)}</span>
              {o}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-[oklch(0.92_0.01_var(--brand-h))] pt-4">
          <div className="flex flex-wrap gap-1" aria-hidden="true">
            {NAV.map((s, i) => (
              <span key={i} className={cn("grid size-6 place-items-center rounded-md text-[0.625rem] font-semibold", s === "done" && "bg-primary text-primary-foreground", s === "flag" && "bg-warning-soft text-warning", s === "now" && "ring-2 ring-primary text-primary", s === "todo" && "bg-[oklch(0.95_0.005_var(--brand-h))] text-[oklch(0.4_0.02_var(--brand-h))]")}>
                {i + 1}
              </span>
            ))}
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-success">
            <CloudCheck weight="fill" className="size-3.5" aria-hidden="true" /> Saved
          </span>
        </div>
      </div>

      <div className="hero-float-a absolute -top-14 -left-2 hidden rounded-2xl border border-white/20 bg-white/90 px-3.5 py-2.5 text-xs shadow-xl backdrop-blur sm:block lg:-left-12">
        <p className="flex items-center gap-1.5 font-semibold text-[oklch(0.25_0.02_var(--brand-h))]"><Pulse className="size-3.5 text-primary" aria-hidden="true" /> Live monitor</p>
        <p className="mt-0.5 text-[oklch(0.45_0.02_var(--brand-h))]">Progress, signals, announcements</p>
      </div>
      <div className="hero-float-b absolute -right-4 -bottom-7 hidden rounded-2xl border border-white/20 bg-white/90 px-3.5 py-2.5 text-xs shadow-xl backdrop-blur sm:block lg:-right-10">
        <p className="flex items-center gap-1.5 font-semibold text-[oklch(0.25_0.02_var(--brand-h))]"><SealCheck weight="fill" className="size-3.5 text-success" aria-hidden="true" /> Result verified</p>
        <p className="mt-0.5 text-[oklch(0.45_0.02_var(--brand-h))]">Anyone can check the QR code</p>
      </div>
      <div className="hero-float-a absolute top-1/2 -right-6 hidden rounded-2xl border border-white/20 bg-white/90 px-3 py-2 text-xs shadow-xl backdrop-blur xl:block" style={{ animationDelay: "-3s" }}>
        <p className="flex items-center gap-1.5 font-semibold text-[oklch(0.25_0.02_var(--brand-h))]"><Flag weight="fill" className="size-3.5 text-warning" aria-hidden="true" /> Marked for review</p>
      </div>
    </div>
  );
}

const PROOF = [
  { icon: Timer, t: "Server-owned clock" },
  { icon: CloudCheck, t: "Answers survive Wi-Fi drops" },
  { icon: ShieldCheck, t: "Answer keys never leave the server" },
];

export function HomeHero() {
  const { hero } = siteConfig;
  return (
    <section className="relative isolate overflow-hidden bg-[oklch(0.15_0.03_var(--brand-h))] px-4 pt-16 pb-24 text-white sm:px-6 sm:pt-24 sm:pb-32">
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <img src={PHOTO} alt="" fetchPriority="high" decoding="async" className="auth-kenburns size-full object-cover opacity-0" />
        <div className="absolute inset-0 bg-[linear-gradient(100deg,oklch(0.13_0.04_var(--brand-h)/0.97)_0%,oklch(0.15_0.04_var(--brand-h)/0.88)_45%,oklch(0.15_0.04_var(--brand-h)/0.55)_100%)]" />
        <div className="hero-grid absolute inset-0 opacity-[0.12]" />
        <div className="auth-orb absolute -top-40 right-0 size-[34rem] rounded-full bg-[oklch(0.55_0.2_var(--brand-h)/0.35)] blur-3xl" />
        <div className="auth-orb absolute -bottom-48 -left-24 size-[30rem] rounded-full bg-[oklch(0.62_0.14_200/0.22)] blur-3xl [animation-delay:-7s]" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-background" />
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
        <div className="hero-rise">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur">
            <span className="size-1.5 rounded-full bg-[oklch(0.8_0.15_160)]" aria-hidden="true" /> Secure examination management
          </p>
          <h1 className="mt-6 text-[clamp(2.6rem,6.4vw,4.9rem)] leading-[0.98] font-semibold tracking-[-0.05em] text-balance">
            {hero.headline}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-pretty text-white/80">{hero.description}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" render={<Link href={hero.primary.href} />} className="bg-white text-[oklch(0.2_0.03_var(--brand-h))] [background-image:none] shadow-lg hover:bg-white/90">
              {hero.primary.label} <ArrowRight className="rtl:rotate-180" />
            </Button>
            <Button size="lg" variant="outline" render={<Link href={hero.secondary.href} />} className="border-white/30 bg-white/5 text-white hover:bg-white/15 hover:text-white">
              <SealCheck /> {hero.secondary.label}
            </Button>
          </div>
          <ul className="mt-10 grid gap-3 text-sm text-white/85 sm:grid-cols-3">
            {PROOF.map((p) => (
              <li key={p.t} className="flex items-center gap-2">
                <CheckCircle weight="fill" className="size-4 shrink-0 text-[oklch(0.8_0.15_160)]" aria-hidden="true" /> {p.t}
              </li>
            ))}
          </ul>
        </div>
        <div className="hero-rise [animation-delay:150ms]">
          <ProductPreview />
        </div>
      </div>
    </section>
  );
}
