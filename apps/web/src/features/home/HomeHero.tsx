"use client";

import Link from "next/link";
import { ArrowRight, SealCheck } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { HeroOrbit } from "./HeroOrbit";

const PHOTO = "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=2200&q=70";
export function HomeHero() {
  const { hero } = siteConfig;
  return (
    <section className="relative isolate overflow-hidden bg-[oklch(0.15_0.03_var(--brand-h))] px-4 pt-16 pb-24 text-white sm:px-6 sm:pt-24 sm:pb-32">
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <img src={PHOTO} alt="" fetchPriority="high" decoding="async" className="auth-kenburns size-full object-cover opacity-0" />
        <div className="absolute inset-0 bg-[linear-gradient(100deg,oklch(0.13_0.04_var(--brand-h)/0.97)_0%,oklch(0.15_0.04_var(--brand-h)/0.88)_45%,oklch(0.15_0.04_var(--brand-h)/0.6)_100%)]" />
        <div className="hero-grid absolute inset-0 opacity-[0.12]" />
        <div className="auth-orb absolute -top-40 right-0 size-[34rem] rounded-full bg-[oklch(0.55_0.2_var(--brand-h)/0.35)] blur-3xl" />
        <div className="auth-orb absolute -bottom-48 -left-24 size-[30rem] rounded-full bg-[oklch(0.62_0.14_200/0.22)] blur-3xl [animation-delay:-7s]" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-background" />
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr_1fr] lg:gap-10">
        <div className="hero-rise">
          <h1 className="text-[clamp(2.6rem,6.4vw,4.9rem)] leading-[0.98] font-semibold tracking-[-0.05em] text-balance">{hero.headline}</h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-pretty text-white/80">{hero.description}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" render={<Link href={hero.primary.href} />} className="bg-white text-[oklch(0.2_0.03_var(--brand-h))] bg-none! shadow-lg hover:bg-white/90">
              {hero.primary.label} <ArrowRight className="rtl:rotate-180" />
            </Button>
            <Button size="lg" variant="outline" render={<Link href={hero.secondary.href} />} className="border-white/30 bg-white/5 text-white hover:bg-white/15 hover:text-white">
              <SealCheck /> {hero.secondary.label}
            </Button>
          </div>
        </div>
        <div className="hero-rise [animation-delay:150ms]">
          <HeroOrbit />
        </div>
      </div>
    </section>
  );
}
