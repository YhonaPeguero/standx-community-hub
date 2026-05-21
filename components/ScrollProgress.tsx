"use client";

import {motion, useReducedMotion, useScroll, useSpring} from "framer-motion";

/**
 * Thin lime progress bar fixed to the top of the viewport.
 *
 * Scales horizontally based on the document scroll position. Disabled when the
 * user prefers reduced motion — the bar simply doesn't mount.
 *
 * z-[60] sits above the navbar (z-50) so the line is always visible.
 */
export default function ScrollProgress() {
  const prefersReducedMotion = useReducedMotion();
  const {scrollYProgress} = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
    mass: 0.4
  });

  if (prefersReducedMotion) {
    return null;
  }

  return (
    <motion.div
      aria-hidden="true"
      style={{scaleX}}
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-accent-lime shadow-[0_0_12px_rgba(0,255,135,0.55)]"
    />
  );
}
