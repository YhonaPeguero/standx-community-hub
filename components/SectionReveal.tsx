"use client";

import type {ReactNode} from "react";
import {motion, useReducedMotion} from "framer-motion";
import {
  sectionRevealReducedVariants,
  sectionRevealVariants
} from "@/lib/motion";

interface SectionRevealProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

export default function SectionReveal({
  children,
  className,
  id
}: SectionRevealProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.section
      id={id}
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{once: true, amount: 0.05, margin: "200px"}}
      variants={
        prefersReducedMotion ? sectionRevealReducedVariants : sectionRevealVariants
      }
    >
      {children}
    </motion.section>
  );
}
