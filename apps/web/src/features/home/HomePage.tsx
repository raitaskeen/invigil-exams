"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import {
  ArrowRight, ArrowsClockwise, Books, ChartBar, CheckCircle, CloudCheck, CloudSlash, Flag, Gavel, Lightning, LockKey, Megaphone,
  PencilLine, QrCode, SealCheck, ShieldCheck, Shuffle, Timer, UserCircleGear, Users, WifiHigh, WifiSlash,
} from "@phosphor-icons/react";
import { Segmented } from "@/components/form/FormField";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { EmblemMarquee, FaqSection, HeroImagery } from "./HomeExtras";
import { Showcase } from "./HomeShowcase";
import { HomeHero } from "./HomeHero";
import { BentoFeatures } from "./HomeBento";

const EASE = [0.16, 1, 0.3, 1] as const;

function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

function SectionHead({ title, body, className }: { title: ReactNode; body: ReactNode; className?: string }) {
  return (
    <Reveal className={cn("max-w-2xl", className)}>
      <h2 className="text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.02] font-semibold tracking-[-0.045em] text-balance">{title}</h2>
      <p className="mt-5 text-lg leading-relaxed text-pretty text-foreground-soft">{body}</p>
    </Reveal>
  );
}

// ---- Workflow by role -----------------------------------------------------------------------------------------

type Role = "examiner" | "candidate" | "admin";
const ROLE_FLOW: Record<Role, { icon: typeof Books; title: string; body: string }[]> = {
  examiner: [
    { icon: Books, title: "Build a question bank", body: "Single-answer, multi-select and written questions with topics, difficulty and marking rules. Import hundreds from CSV or JSON with row-by-row checks." },
    { icon: ShieldCheck, title: "Publish only when it's right", body: "A checklist blocks publishing until every paper adds up to the total and the draw plan can be met. Preview it as a candidate in a sandbox first." },
    { icon: Megaphone, title: "Watch it live", body: "Progress, online status and integrity signals per candidate. Send announcements, add time for a verified disruption, with the reason on record." },
    { icon: PencilLine, title: "Grade, then publish", body: "Objective answers mark themselves. Written answers queue for you with mark limits enforced. Results go out when you say so." },
  ],
  candidate: [
    { icon: Timer, title: "A clock you can trust", body: "Time is kept by the server. Refresh, switch device or lose power: you come back to the same question with the same time left." },
    { icon: Flag, title: "Know where you stand", body: "Answered, unanswered and marked-for-review at a glance, a review screen before submitting, and a scratchpad for rough work." },
    { icon: UserCircleGear, title: "Make it yours", body: "Text size, one question at a time or all on one page, and a high-contrast mode. Remembered on your device." },
    { icon: SealCheck, title: "Results you can prove", body: "Download a PDF report with a QR code anyone can verify, and raise a dispute on a specific question if something looks wrong." },
  ],
  admin: [
    { icon: Users, title: "People and roles", body: "Create examiners and candidates, change roles and deactivate accounts. A deactivated user is signed out everywhere, immediately." },
    { icon: LockKey, title: "Permissions on the server", body: "Every request is checked against the user's role on the API. Hiding a button is never the security boundary." },
    { icon: ChartBar, title: "Every exam in view", body: "Admins see all examiners' exams, analytics and disputes, with an audit trail of who changed what and when." },
    { icon: Lightning, title: "Fast everywhere", body: "One edge deployment serves the site, API and live updates from the same origin, close to every candidate." },
  ],
};

function Workflow() {
  const [role, setRole] = useState<Role>("examiner");
  return (
    <section id="workflow" className="scroll-mt-24 px-4 py-24 sm:px-6 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHead title="One system, three people in the room." body="Each role gets its own workspace, built around the job it has to do on exam day." />
          <Reveal>
            <Segmented<Role>
              label="Role"
              value={role}
              onChange={setRole}
              options={[{ value: "examiner", label: "Examiner" }, { value: "candidate", label: "Candidate" }, { value: "admin", label: "Administrator" }]}
              className="w-full sm:w-auto"
            />
          </Reveal>
        </div>
        <div className="relative mt-12 min-h-[22rem]">
          <AnimatePresence mode="wait">
            <motion.ol
              key={role}
              className="grid gap-px overflow-hidden rounded-[1.5rem] border border-border bg-border sm:grid-cols-2"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.45, ease: EASE }}
            >
              {ROLE_FLOW[role].map((s, i) => (
                <motion.li
                  key={s.title}
                  className="group bg-card p-7 sm:p-9"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: EASE, delay: 0.06 * i }}
                >
                  <span className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand-ink">
                    <s.icon weight="duotone" className="size-[1.375rem]" />
                  </span>
                  <h3 className="mt-6 text-xl font-semibold tracking-[-0.025em]">{s.title}</h3>
                  <p className="mt-2.5 leading-relaxed text-foreground-soft">{s.body}</p>
                </motion.li>
              ))}
            </motion.ol>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

// ---- Trust: verification + disputes ----------------------------------------------------------------------------

function QrArt({ code }: { code: string }) {
  // Decorative pattern derived from the code (the real PDF carries a scannable QR).
  const cells = useMemo(() => {
    let h = 0;
    for (const ch of code) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return Array.from({ length: 121 }, (_, i) => ((h ^ (i * 2654435761)) >>> (i % 13)) & 1);
  }, [code]);
  const finder = (x: number, y: number) => x < 3 && y < 3;
  return (
    <svg viewBox="0 0 11 11" className="size-24 rounded-lg bg-white p-1.5" aria-hidden="true">
      {cells.map((v, i) => {
        const x = i % 11;
        const y = Math.floor(i / 11);
        const f = finder(x, y) || finder(10 - x, y) || finder(x, 10 - y);
        return (f ? (x % 10 === 0 || y % 10 === 0 || (x % 10 !== 1 && y % 10 !== 1) || (x === 1 && y === 1) || (x === 9 && y === 1) || (x === 1 && y === 9)) : v) ? <rect key={i} x={x} y={y} width="1" height="1" fill="#16181d" /> : null;
      })}
    </svg>
  );
}

function Trust() {
  const router = useRouter();
  const [code, setCode] = useState("");
  return (
    <section className="px-4 pb-24 sm:px-6 sm:pb-32">
      <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-2">
        <Reveal>
          <div className="flex h-full flex-col rounded-[1.5rem] border border-border bg-card p-7 shadow-sm sm:p-9">
            <span className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand-ink"><QrCode weight="duotone" className="size-[1.375rem]" /></span>
            <h3 className="mt-6 text-2xl font-semibold tracking-[-0.03em]">Results anyone can check</h3>
            <p className="mt-2.5 leading-relaxed text-foreground-soft">Every published result report carries a verification code and QR. An employer or another institution can confirm it is genuine, and sees only the exam, a masked name and the score.</p>
            <div className="mt-6 flex items-center gap-5 rounded-2xl bg-surface-sunken p-4">
              <QrArt code="7KQ2MX9PHA" />
              <div className="text-sm">
                <p className="font-semibold">CS-201 Data Structures</p>
                <p className="text-muted-foreground">H**** I**** · 86.8% · Pass</p>
                <p className="mt-2 font-mono text-xs tracking-wider text-muted-foreground">7KQ2MX9PHA</p>
              </div>
            </div>
            <form
              className="mt-5 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                router.push(`/verify${code.trim() ? `?code=${encodeURIComponent(code.trim().toUpperCase())}` : ""}`);
              }}
            >
              <label className="sr-only" htmlFor="home-verify">Verification code</label>
              <input id="home-verify" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter a verification code" className="h-11 min-w-0 flex-1 rounded-[var(--radius-control)] border border-control-border/70 bg-surface px-3 font-mono text-sm tracking-wider uppercase shadow-xs outline-none placeholder:font-sans placeholder:tracking-normal placeholder:normal-case focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25" />
              <Button type="submit" variant="outline">Verify</Button>
            </form>
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <div className="flex h-full flex-col rounded-[1.5rem] border border-border bg-card p-7 shadow-sm sm:p-9">
            <span className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand-ink"><Gavel weight="duotone" className="size-[1.375rem]" /></span>
            <h3 className="mt-6 text-2xl font-semibold tracking-[-0.03em]">Disputes with a paper trail</h3>
            <p className="mt-2.5 leading-relaxed text-foreground-soft">A candidate can challenge the mark on a specific question. The examiner answers with a reason the candidate sees; an accepted dispute recalculates the total, is logged, and the verification record updates with it.</p>
            <ol className="mt-6 space-y-3 text-sm">
              {[
                { t: "Raised by Sana M.", d: "Q7 · Hashing · “Two of three correct, but marked 0.”", tone: "bg-warning" },
                { t: "Reviewed by Dr. Ayesha K.", d: "Accepted: the prompt didn't say all-or-nothing.", tone: "bg-primary" },
                { t: "Score updated", d: "21 → 24 of 37 · verification record refreshed", tone: "bg-success" },
              ].map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex flex-col items-center">
                    <span className={cn("mt-1.5 size-2.5 rounded-full", s.tone)} />
                    {i < 2 && <span className="mt-1 w-px flex-1 bg-border" />}
                  </span>
                  <span className="pb-1">
                    <b className="block font-semibold">{s.t}</b>
                    <span className="text-muted-foreground">{s.d}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ---- Page ---------------------------------------------------------------------------------------------------------

export function HomePage() {
  return (
    <>
      <HomeHero />

      <EmblemMarquee />
      <Showcase />
      <BentoFeatures />
      <Workflow />
      <Trust />
      <FaqSection />

      <section className="px-4 pb-24 sm:px-6">
        <Reveal className="mx-auto max-w-6xl">
          <div className="relative overflow-hidden rounded-[2rem] bg-foreground px-7 py-14 text-background sm:px-14 sm:py-20">
            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-xl">
                <h2 className="text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.02] font-semibold tracking-[-0.045em]">See a live exam in under a minute.</h2>
                <p className="mt-4 text-lg text-background/70">The demo has a quiz running right now, a graded midterm with published results, and an open dispute waiting for an examiner.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button size="lg" render={<Link href="/login" />} className="bg-background text-foreground [background-image:none] hover:bg-background/90">
                  Open the live demo <ArrowRight className="rtl:rotate-180" />
                </Button>
              </div>
            </div>
            <ul className="relative mt-12 grid gap-4 border-t border-background/15 pt-8 text-sm text-background/75 sm:grid-cols-3">
              <li className="flex items-center gap-2.5"><CheckCircle weight="fill" className="size-4 text-background" /> Answer keys never leave the server</li>
              <li className="flex items-center gap-2.5"><CheckCircle weight="fill" className="size-4 text-background" /> No webcam or screen recording</li>
              <li className="flex items-center gap-2.5"><CheckCircle weight="fill" className="size-4 text-background" /> Works on phones and slow networks</li>
            </ul>
          </div>
        </Reveal>
      </section>
    </>
  );
}
