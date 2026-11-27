"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, CloudCheck, LockKey, SealCheck, Timer } from "@phosphor-icons/react";
import { Logo } from "@/components/brand/Logo";
import { Preferences } from "@/components/layout/Preferences";
import { siteConfig } from "@/lib/site-config";

type AuthShellProps = {
  title: string;
  description: string;
  /** Below the form - usually "Already have an account? Log in". */
  footer: ReactNode;
  children: ReactNode;
  /** Optional photo behind the form column, under a frosted overlay that keeps the form high-contrast. */
  backdrop?: { src: string; alt: string };
};

/**
 * Sign-in/sign-up layout: a calm form column, and (from lg) a brand panel with what the product guarantees.
 * The form is the only thing on a phone - no scrolling past decoration to reach the fields.
 */
export function AuthShell({ title, description, footer, children, backdrop }: AuthShellProps) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="relative isolate flex flex-col px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-8 sm:px-10">
        {backdrop && (
          <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
            <img src={backdrop.src} alt="" decoding="async" className="size-full scale-105 object-cover animate-[fade-in_900ms_var(--ease-out)]" />
            <div className="absolute inset-0 bg-gradient-to-b from-[oklch(0.15_0.03_260/0.78)] via-[oklch(0.15_0.03_260/0.62)] to-[oklch(0.12_0.03_260/0.85)] backdrop-blur-[3px]" />
          </div>
        )}
        <header className={backdrop ? "flex items-center justify-between rounded-2xl border border-white/15 bg-background/85 px-3 py-1.5 backdrop-blur-xl" : "flex items-center justify-between"}>
          <Link href="/" className="rounded-md" aria-label={`${siteConfig.productName} home`}>
            <Logo />
          </Link>
          <div className="flex items-center gap-1">
            <Preferences />
            <Link
              href="/"
              className="hidden min-h-10 items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
              Back to site
            </Link>
          </div>
        </header>

        <main id="main" className={backdrop ? "mx-auto flex w-full max-w-[27rem] flex-1 flex-col justify-center py-8 animate-rise" : "mx-auto flex w-full max-w-[25rem] flex-1 flex-col justify-center py-10 animate-rise"}>
          <div className={backdrop ? "rounded-[1.5rem] border border-white/15 bg-background/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8" : undefined}>
          <h1 className="text-[2rem] leading-tight font-semibold tracking-[-0.04em]">{title}</h1>
          <p className="mt-2 text-foreground-soft">{description}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-8 text-center text-sm text-muted-foreground">{footer}</p>
          </div>
        </main>

        <p className={backdrop ? "text-center text-xs text-white/75" : "text-center text-xs text-muted-foreground"}>
          Protected by secure sessions and rate-limited sign-in.
        </p>
      </div>

      <aside className="relative m-3 hidden overflow-hidden rounded-[1.75rem] bg-foreground text-background lg:flex lg:flex-col lg:justify-between lg:p-14">
        <div className="relative">
          <p className="max-w-md text-[2.75rem] leading-[1] font-semibold tracking-[-0.05em] text-balance">{siteConfig.tagline}</p>
          <p className="mt-5 max-w-md text-lg text-background/70">Sign in with one of the demo accounts to see each role.</p>
        </div>
        <ul className="relative grid gap-3">
          {[
            { icon: Timer, t: "The server keeps the time", d: "Refresh or switch device - the deadline doesn't move." },
            { icon: CloudCheck, t: "Answers save as you go", d: "Offline answers wait on the device and sync later." },
            { icon: LockKey, t: "Keys stay on the server", d: "Correct answers are never sent to the browser." },
            { icon: SealCheck, t: "Verifiable results", d: "Every report carries a code anyone can check." },
          ].map((x, i) => (
            <li key={x.t} className="flex items-start gap-4 rounded-2xl border border-background/10 bg-background/[0.05] p-4 animate-[rise_500ms_var(--ease-out)_backwards]" style={{ animationDelay: `${200 + i * 90}ms` }}>
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-background/10"><x.icon weight="duotone" className="size-5" /></span>
              <span>
                <b className="block font-semibold">{x.t}</b>
                <span className="text-sm text-background/65">{x.d}</span>
              </span>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

/** Kept so older imports keep working; the new shell lays out its own form spacing. */
export function AuthFormLayout({ children, submit }: { children: ReactNode; submit: ReactNode; actionHint?: string }) {
  return (
    <div className="flex flex-col gap-4">
      {children}
      <div className="pt-2">{submit}</div>
    </div>
  );
}
