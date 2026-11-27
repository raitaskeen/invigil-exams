import type { PaletteId } from "./palette";

/**
 * Everything brand- and copy-related for the public site, in one file. Plain claims only: every sentence
 * describes something the product actually does. No invented metrics, customers or quotes.
 */
export const siteConfig = {
  productName: "Invigil",
  tagline: "Online exams that hold up under pressure.",
  repoUrl: "https://github.com/raitaskeen/invigil-exams",
  brand: {
    palette: "cobalt" as PaletteId,
  },

  nav: [
    { label: "How it works", href: "/#workflow" },
    { label: "Resilience", href: "/#resilience" },
    { label: "Fairness", href: "/#fairness" },
    { label: "Architecture", href: "/architecture" },
    { label: "Verify a result", href: "/verify" },
  ],

  hero: {
    headline: "Exams that hold up under pressure.",
    description:
      "Invigil runs the whole exam: a reusable question bank, fair randomised papers, a calm workspace that keeps saving when the Wi-Fi drops, live monitoring, grading and results anyone can verify.",
    primary: { label: "Open the live demo", href: "/login" },
    secondary: { label: "Verify a result", href: "/verify" },
  },

  footer: [
    {
      heading: "Product",
      links: [
        { label: "How it works", href: "/#workflow" },
        { label: "Resilience", href: "/#resilience" },
        { label: "Fairness", href: "/#fairness" },
        { label: "Architecture", href: "/architecture" },
        { label: "FAQ", href: "/#faq" },
      ],
    },
    {
      heading: "Access",
      links: [
        { label: "Sign in", href: "/login" },
        { label: "Create a candidate account", href: "/register" },
        { label: "Verify a result", href: "/verify" },
      ],
    },
    {
      heading: "For candidates",
      links: [
        { label: "My exams", href: "/app/exams" },
        { label: "Practice tests", href: "/app/practice" },
        { label: "Past papers", href: "/app/papers" },
        { label: "Results", href: "/app/results" },
      ],
    },
  ],
};
