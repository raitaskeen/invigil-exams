"use client";

import type { CSSProperties } from "react";
import { ChartBar, CloudCheck, Exam, LockKey, QrCode, ShieldCheck, Timer, WifiHigh, type Icon } from "@phosphor-icons/react";
import { LogoMark } from "@/components/brand/Logo";

/**
 * Hero visual: the Invigil mark at the centre of three slowly turning rings, each carrying the guarantees the
 * product makes. Pure CSS transforms (GPU-cheap), counter-rotated so icons stay upright; static with reduced motion.
 */
const RINGS: { size: number; dur: number; reverse?: boolean; items: { icon: Icon; label: string }[] }[] = [
  { size: 58, dur: 26, items: [{ icon: Timer, label: "Server time" }, { icon: CloudCheck, label: "Auto-save" }] },
  { size: 80, dur: 38, reverse: true, items: [{ icon: ShieldCheck, label: "Role checks" }, { icon: WifiHigh, label: "Offline-safe" }, { icon: LockKey, label: "Keys hidden" }] },
  { size: 100, dur: 52, items: [{ icon: QrCode, label: "Verifiable" }, { icon: ChartBar, label: "Analytics" }, { icon: Exam, label: "Fair papers" }] },
];

export function HeroOrbit() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[30rem]" role="img" aria-label="Invigil at the centre of its guarantees: server time, auto-save, role checks, offline safety, hidden answer keys, verifiable results, analytics and fair papers.">
      <div className="absolute inset-[18%] rounded-full bg-[radial-gradient(closest-side,oklch(0.6_0.2_var(--brand-h)/0.6),transparent)] blur-2xl" aria-hidden="true" />
      {RINGS.map((ring, r) => (
        <div
          key={r}
          className="orbit-ring absolute top-1/2 left-1/2 rounded-full border border-white/12"
          style={{ width: `${ring.size}%`, height: `${ring.size}%`, "--dur": `${ring.dur}s`, "--dir": ring.reverse ? "reverse" : "normal" } as CSSProperties}
          aria-hidden="true"
        >
          <span className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,oklch(0.75_0.15_var(--brand-h)/0.55)_40deg,transparent_90deg)] [mask:radial-gradient(closest-side,transparent_calc(100%-2px),#000_calc(100%-1px))]" />
          {ring.items.map((it, i) => {
            const angle = (360 / ring.items.length) * i + r * 35;
            return (
              <span key={it.label} className="absolute size-0" style={{ left: `${50 + 50 * Math.cos((angle * Math.PI) / 180)}%`, top: `${50 + 50 * Math.sin((angle * Math.PI) / 180)}%` }}>
                <span className="orbit-chip absolute" style={{ transform: "translate(-50%,-50%)" }}>
                  <span className="orbit-upright flex items-center gap-1.5 rounded-full border border-white/15 bg-[oklch(0.2_0.04_var(--brand-h)/0.85)] p-1 text-[0.6875rem] sm:pe-2.5 font-medium whitespace-nowrap text-white shadow-lg backdrop-blur-md">
                    <span className="grid size-6 place-items-center rounded-full bg-primary/30 text-white">
                      <it.icon weight="duotone" className="size-3.5" />
                    </span>
                    <span className="hidden sm:inline">{it.label}</span>
                  </span>
                </span>
              </span>
            );
          })}
        </div>
      ))}
      <div className="absolute top-1/2 left-1/2 grid size-[20%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[28%] border border-white/20 bg-[oklch(0.2_0.05_var(--brand-h)/0.9)] shadow-[0_0_60px_oklch(0.6_0.2_var(--brand-h)/0.6),inset_0_1px_0_rgb(255_255_255/0.2)] backdrop-blur-xl" aria-hidden="true">
        <span className="orbit-pulse absolute inset-0 rounded-[28%] ring-2 ring-primary/50" />
        <LogoMark className="size-[55%]" />
      </div>
    </div>
  );
}
