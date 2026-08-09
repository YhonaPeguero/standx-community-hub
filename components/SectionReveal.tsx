"use client";

import type {ReactNode} from "react";
import {motion} from "framer-motion";
import {sectionRevealVariants} from "@/lib/motion";

interface SectionRevealProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

/**
 * Scroll-reveal wrapper for page sections.
 *
 * The reduced-motion path is CSS (`.section-reveal` in globals.css), NOT a
 * `useReducedMotion()` branch on `variants`. That hook is `false` during SSR
 * and `true` on a reduced-motion client, so the two passes emit different
 * inline styles — `opacity:0;transform:translateY(24px)` on the server versus
 * `opacity:0` on the client — and React warns that `style` did not match.
 * Emitting one variant on both passes and letting the media query drop the
 * translate keeps hydration clean. See components/ScrollProgress.tsx for the
 * same rule applied to a whole element.
 */
export default function SectionReveal({
  children,
  className,
  id
}: SectionRevealProps) {
  return (
    <motion.section
      id={id}
      className={`section-reveal${className ? ` ${className}` : ""}`}
      initial="hidden"
      whileInView="visible"
      viewport={{once: true, amount: 0.05, margin: "200px"}}
      variants={sectionRevealVariants}
    >
      {children}
    </motion.section>
  );
}
