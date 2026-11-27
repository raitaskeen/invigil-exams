"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, GithubLogo, Pulse, SealCheck } from "@phosphor-icons/react";
import { Logo } from "@/components/brand/Logo";
import { Navbar } from "@/components/layout/Navbar";
import { siteConfig } from "@/lib/site-config";

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2 focus:shadow-md"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main" className="flex-1">
        {children}
      </main>
      {/* Always dark, in both themes: a clear, high-contrast end to the page. */}
      <footer className="bg-[oklch(0.17_0.02_260)] text-[oklch(0.96_0.005_260)]">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:grid-cols-2 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
          <div className="space-y-4">
            <Link href="/" className="inline-block rounded-md [&_*]:text-current" aria-label={`${siteConfig.productName} home`}>
              <Logo />
            </Link>
            <p className="max-w-xs text-sm text-white/70">{siteConfig.tagline}</p>
            <div className="flex flex-wrap gap-2">
              <a href="/api/health" className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 text-xs font-medium text-white/85 transition-colors hover:bg-white/10">
                <Pulse className="size-3.5 text-emerald-400" aria-hidden="true" /> System status
              </a>
              <Link href="/verify" className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 text-xs font-medium text-white/85 transition-colors hover:bg-white/10">
                <SealCheck className="size-3.5" aria-hidden="true" /> Verify a result
              </Link>
            </div>
          </div>
          {siteConfig.footer.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <p className="text-xs font-semibold tracking-wider text-white/50 uppercase">{col.heading}</p>
              <ul className="mt-4 space-y-1">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="inline-flex min-h-10 items-center text-sm text-white/80 transition-colors hover:text-white pointer-fine:min-h-8">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
          <div>
            <p className="text-xs font-semibold tracking-wider text-white/50 uppercase">Contact</p>
            <ul className="mt-4 space-y-1 text-sm">
              <li>
                <a href={siteConfig.repoUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-1.5 text-white/80 transition-colors hover:text-white pointer-fine:min-h-8">
                  <GithubLogo className="size-4" aria-hidden="true" /> Source on GitHub <ArrowUpRight className="size-3" aria-hidden="true" />
                </a>
              </li>
              <li>
                <a href={`${siteConfig.repoUrl}/issues`} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center text-white/80 transition-colors hover:text-white pointer-fine:min-h-8">
                  Report an issue
                </a>
              </li>
              <li>
                <Link href="/app/feedback" className="inline-flex min-h-10 items-center text-white/80 transition-colors hover:text-white pointer-fine:min-h-8">
                  Feedback hub
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p>© {new Date().getFullYear()} {siteConfig.productName}. Built for Technoverse 5.0 Web-e-Thon.</p>
            <p>Runs on Cloudflare Workers + D1.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
