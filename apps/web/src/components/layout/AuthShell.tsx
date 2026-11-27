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
  /** Photo behind the card. Defaults to students studying together. */
  backdrop?: { src: string; alt: string };
};

const DEFAULT_BACKDROP = "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=2000&q=70";

const PROMISES = [
  { icon: Timer, t: "Server-kept time" },
  { icon: CloudCheck, t: "Saves offline" },
  { icon: LockKey, t: "Keys never sent" },
  { icon: SealCheck, t: "Verifiable results" },
];

/**
 * Sign-in / sign-up: one centered card over a slowly drifting photo. The card is opaque enough to stay
 * high-contrast in both themes; the photo only sets the mood. On phones the card fills the width.
 */
export function AuthShell({ title, description, footer, children, backdrop }: AuthShellProps) {
  const src = backdrop?.src ?? DEFAULT_BACKDROP;
  return (
    <div className="relative isolate flex min-h-dvh flex-col overflow-hidden bg-[oklch(0.16_0.03_262)] px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-6 sm:px-6">
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <img src={src} alt="" decoding="async" fetchPriority="high" className="auth-kenburns size-full object-cover opacity-0 [animation-fill-mode:both]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,oklch(0.16_0.04_262/0.45),oklch(0.12_0.03_262/0.88)_75%)]" />
        <div className="auth-orb absolute -top-32 -left-24 size-[28rem] rounded-full bg-[oklch(0.55_0.2_262/0.35)] blur-3xl" />
        <div className="auth-orb absolute -right-24 -bottom-40 size-[30rem] rounded-full bg-[oklch(0.6_0.17_200/0.25)] blur-3xl [animation-delay:-6s]" />
      </div>

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between text-white">
        <Link href="/" className="rounded-md [&_span]:text-white" aria-label={`${siteConfig.productName} home`}>
          <Logo />
        </Link>
        <div className="flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-1 backdrop-blur-md [&_button]:text-white">
          <Preferences />
          <Link href="/" className="hidden min-h-10 items-center gap-1.5 rounded-full px-3 text-sm text-white/85 transition-colors hover:text-white sm:inline-flex">
            <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
            Back to site
          </Link>
        </div>
      </header>

      <main id="main" className="flex flex-1 items-center justify-center py-8">
        <div className="w-full max-w-[28rem] animate-[rise_600ms_var(--ease-out)_backwards]">
          <div className="rounded-[1.75rem] border border-white/20 bg-background/[0.93] p-6 shadow-[0_30px_80px_-20px_oklch(0.1_0.05_262/0.7)] backdrop-blur-2xl sm:p-9">
            <h1 className="text-[1.875rem] leading-tight font-semibold tracking-[-0.04em]">{title}</h1>
            <p className="mt-1.5 text-foreground-soft">{description}</p>
            <div className="mt-7">{children}</div>
            <p className="mt-7 text-center text-sm text-muted-foreground">{footer}</p>
          </div>
          <ul className="mt-5 flex flex-wrap justify-center gap-2" aria-label="What Invigil guarantees">
            {PROMISES.map((p, i) => (
              <li key={p.t} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-md animate-[rise_500ms_var(--ease-out)_backwards]" style={{ animationDelay: `${300 + i * 80}ms` }}>
                <p.icon weight="duotone" className="size-3.5" aria-hidden="true" /> {p.t}
              </li>
            ))}
          </ul>
        </div>
      </main>

      <p className="text-center text-xs text-white/60">Protected by secure sessions and rate-limited sign-in.</p>
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
