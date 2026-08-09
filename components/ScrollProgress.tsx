"use client";

import {motion, useScroll, useSpring} from "framer-motion";

/**
 * Thin lime progress bar fixed to the top of the viewport.
 *
 * Scales horizontally based on the document scroll position. Hidden when the
 * user prefers reduced motion.
 *
 * The reduced-motion path is CSS (`.scroll-progress` in globals.css), NOT an
 * early `return null` on `useReducedMotion()`. That hook reads `matchMedia`,
 * so it is `false` during SSR and `true` on a reduced-motion client — the
 * element would be in the server HTML and absent on hydration, which shifts
 * every following sibling and throws "Expected server HTML to contain a
 * matching <header>" at the Navbar. Keeping the DOM shape identical on both
 * passes and letting the media query hide it avoids that entirely.
 *
 * z-[60] sits above the navbar (z-50) so the line is always visible.
 */
export default function ScrollProgress() {
  const {scrollYProgress} = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
    mass: 0.4
  });

  return (
    <motion.div
      aria-hidden="true"
      style={{scaleX}}
      className="scroll-progress pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-accent-lime shadow-[0_0_12px_rgba(0,255,135,0.55)]"
    />
  );
}
