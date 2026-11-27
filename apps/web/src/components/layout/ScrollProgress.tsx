"use client";

import { motion, useReducedMotion, useScroll, useSpring } from "motion/react";

/** A thin brand-gradient bar along the top that fills as you scroll the page. */
export function ScrollProgress() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.3 });
  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX: reduce ? scrollYProgress : scaleX }}
      className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-gradient-to-r from-primary via-[oklch(0.72_0.14_200)] to-[oklch(0.65_0.19_290)]"
    />
  );
}
