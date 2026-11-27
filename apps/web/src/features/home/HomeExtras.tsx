"use client";

import { motion, useReducedMotion } from "motion/react";
import { CaretDown, CheckCircle, CloudCheck, SealCheck, Timer } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;
const img = (id: string, w: number) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=75`;

// ---- Hero imagery -------------------------------------------------------------------------------------------

const HERO = [
  { id: "photo-1434030216411-0b793f4b4173", alt: "A student writing answers on paper at a desk" },
  { id: "photo-1501504905252-473c47e087f8", alt: "A laptop and an open notebook on a study desk" },
  { id: "photo-1541339907198-e08756dedf3f", alt: "Graduates in gowns throwing their caps in the air" },
];

export function HeroImagery() {
  const reduce = useReducedMotion();
  const enter = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 28, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { duration: 0.8, ease: EASE, delay },
  });
  return (
    <div className="relative mx-auto mt-16 max-w-5xl sm:mt-20">
      <div className="grid grid-cols-6 gap-3 sm:gap-4">
        <motion.figure {...enter(0.2)} className="group relative col-span-6 overflow-hidden rounded-[1.75rem] bg-muted shadow-lg sm:col-span-4 sm:row-span-2">
          <img
            src={img(HERO[0]!.id, 1200)}
            srcSet={`${img(HERO[0]!.id, 700)} 700w, ${img(HERO[0]!.id, 1200)} 1200w`}
            sizes="(min-width: 640px) 66vw, 100vw"
            alt={HERO[0]!.alt}
            fetchPriority="high"
            decoding="async"
            className="aspect-[16/10] size-full object-cover transition-transform duration-700 ease-[var(--ease-out)] group-hover:scale-[1.03] sm:aspect-auto"
          />
          <div className="absolute inset-x-3 bottom-3 flex flex-wrap gap-2 sm:inset-x-5 sm:bottom-5">
            <Chip icon={Timer}>Server-kept timer</Chip>
            <Chip icon={CloudCheck}>Saved on every answer</Chip>
          </div>
        </motion.figure>
        {HERO.slice(1).map((p, i) => (
          <motion.figure key={p.id} {...enter(0.32 + i * 0.1)} className="group relative col-span-3 overflow-hidden rounded-[1.5rem] bg-muted shadow-md sm:col-span-2">
            <img
              src={img(p.id, 600)}
              alt={p.alt}
              loading="lazy"
              decoding="async"
              className="aspect-[4/3] size-full object-cover transition-transform duration-700 ease-[var(--ease-out)] group-hover:scale-[1.05]"
            />
            {i === 1 && (
              <div className="absolute inset-x-2 bottom-2 sm:inset-x-3 sm:bottom-3">
                <Chip icon={SealCheck}>QR-verified results</Chip>
              </div>
            )}
          </motion.figure>
        ))}
      </div>
    </div>
  );
}

function Chip({ icon: Icon, children }: { icon: typeof Timer; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-black/40 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-xl">
      <Icon weight="fill" className="size-3.5" aria-hidden="true" /> {children}
    </span>
  );
}

// ---- Institution emblems marquee ------------------------------------------------------------------------------
// Generic, custom-drawn emblems for kinds of institutions. They are categories, not real organisations or partners.

type Emblem = { label: string; glyph: React.ReactNode };
const glyphs = {
  gear: <path d="M24 17a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm0-6 2 4 4-1 1 4 4 2-2 4 2 4-4 2-1 4-4-1-2 4-2-4-4 1-1-4-4-2 2-4-2-4 4-2 1-4 4 1 2-4Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
  cross: <path d="M20 13h8v7h7v8h-7v7h-8v-7h-7v-8h7z" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />,
  check: <path d="m15 24 6 6 12-13" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />,
  book: <path d="M12 15c4-2 8-2 12 1 4-3 8-3 12-1v19c-4-2-8-2-12 1-4-3-8-3-12-1Zm12 1v19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
  chart: <path d="M14 34V22m7 12V16m7 18v-9m7 9V13" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />,
  globe: <g fill="none" stroke="currentColor" strokeWidth="2"><circle cx="24" cy="24" r="11" /><path d="M13 24h22M24 13c4 4 4 18 0 22m0-22c-4 4-4 18 0 22" /></g>,
  flask: <path d="M20 12h8m-6 0v9l-8 13a2 2 0 0 0 2 3h16a2 2 0 0 0 2-3l-8-13v-9M17 30h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
  cap: <path d="m8 21 16-8 16 8-16 8Zm6 3v7c6 4 14 4 20 0v-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
  scale: <path d="M24 12v24m-9 0h18M14 17h20m-20 0-5 10h10Zm20 0-5 10h10Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
  pen: <path d="m30 12 6 6-17 17-8 2 2-8Zm-4 4 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
};
const EMBLEMS: Emblem[] = [
  { label: "Engineering faculties", glyph: glyphs.gear },
  { label: "Medical boards", glyph: glyphs.cross },
  { label: "Accredited testing centres", glyph: glyphs.check },
  { label: "Secondary school boards", glyph: glyphs.book },
  { label: "Business schools", glyph: glyphs.chart },
  { label: "Language institutes", glyph: glyphs.globe },
  { label: "Science colleges", glyph: glyphs.flask },
  { label: "Universities", glyph: glyphs.cap },
  { label: "Law schools", glyph: glyphs.scale },
  { label: "Certification bodies", glyph: glyphs.pen },
];

function EmblemBadge({ e, i }: { e: Emblem; i: number }) {
  return (
    <li className="flex shrink-0 items-center gap-3 rounded-2xl border border-border bg-card/70 px-4 py-3 shadow-xs transition-colors hover:border-primary/40">
      <svg viewBox="0 0 48 48" className="size-10 text-brand-ink" aria-hidden="true">
        <path d="M24 3 42 9v14c0 11-8 19-18 22C14 42 6 34 6 23V9Z" className={cn(i % 2 ? "fill-brand-soft" : "fill-muted")} stroke="currentColor" strokeOpacity=".35" strokeWidth="1.5" />
        <g transform="translate(0 -1)">{e.glyph}</g>
      </svg>
      <span className="text-sm font-medium whitespace-nowrap text-foreground-soft">{e.label}</span>
    </li>
  );
}

export function EmblemMarquee() {
  return (
    <section aria-label="Institution types" className="overflow-hidden py-12 sm:py-16">
      <div className="marquee-mask">
        <ul className="marquee-track flex w-max gap-4 px-2" aria-label="Institution types">
          {[...EMBLEMS, ...EMBLEMS].map((e, i) => (
            <EmblemBadge key={i} e={e} i={i} />
          ))}
        </ul>
      </div>
    </section>
  );
}

// ---- FAQ accordion ----------------------------------------------------------------------------------------------

const FAQ = [
  {
    q: "How do I register?",
    a: "Open Create account, enter your name, email and a password with at least 8 characters including a letter and a number. New accounts are candidate accounts. Examiner and admin accounts are created by an administrator.",
  },
  {
    q: "I forgot my password. What now?",
    a: "On the sign-in page choose Forgot password and enter your email. An administrator sees the request and gives you a one-time 8-character code (valid for 30 minutes). Enter it with your new password; every old session is signed out.",
  },
  {
    q: "How does a live exam work?",
    a: "Your assigned exams appear in My exams. Start opens a focused workspace with a server-kept timer: the deadline is the earlier of your start time plus the duration and the end of the exam window. Answers save as you go, and you can flag questions and review before submitting.",
  },
  {
    q: "What happens if my internet drops mid-exam?",
    a: "Keep answering. Answers are stored on your device and retried with backoff, then sent automatically when the connection returns. The timer does not pause, so reconnect when you can. If time runs out, whatever reached the server before the deadline is submitted.",
  },
  {
    q: "When and how do I see my results?",
    a: "Objective questions are marked automatically; written answers are graded by the examiner. Results appear in Results once the examiner publishes them, with your score, your own position among candidates and a downloadable PDF report.",
  },
  {
    q: "How can someone verify my result?",
    a: "Every published result has a verification code and a QR code on its PDF. Anyone can enter the code on the Verify page to confirm the exam, score and date without signing in. Names are masked.",
  },
  {
    q: "Can I practise before the real exam?",
    a: "Yes. Practice shows mock tests published by examiners. Multiple-choice answers are marked instantly with a full answer review. Written answers are not auto-graded. Practice attempts never count towards official results or rankings.",
  },
];

export function FaqSection() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-24 px-4 py-24 sm:px-6 sm:py-28">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <h2 id="faq-title" className="text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.02] font-semibold tracking-[-0.045em]">Questions, answered.</h2>
          <p className="mt-4 max-w-sm text-lg text-foreground-soft">Everything candidates and examiners usually ask before their first exam.</p>
          <ul className="mt-8 space-y-2 text-sm text-foreground-soft">
            {["No installs or webcam", "Works on phones and slow networks", "Results anyone can verify"].map((t) => (
              <li key={t} className="flex items-center gap-2"><CheckCircle weight="fill" className="size-4 text-success" /> {t}</li>
            ))}
          </ul>
        </div>
        <div className="scroll-reveal divide-y divide-border rounded-[1.5rem] border border-border bg-card shadow-sm">
          {FAQ.map((f, i) => (
            <details key={f.q} name="faq" className="faq-item group px-5 sm:px-6" open={i === 0}>
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-start font-semibold outline-none focus-visible:text-primary [&::-webkit-details-marker]:hidden">
                {f.q}
                <CaretDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-180" aria-hidden="true" />
              </summary>
              <p className="faq-body pb-5 text-[0.9375rem] leading-relaxed text-foreground-soft">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
