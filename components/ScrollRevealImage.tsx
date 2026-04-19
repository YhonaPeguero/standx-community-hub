"use client";

import Image from "next/image";
import {useEffect, useRef, useState} from "react";

interface ScrollRevealImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  /** Inline style overrides for the wrapper div */
  wrapperStyle?: React.CSSProperties;
  /** Extra CSS classes for the wrapper div */
  wrapperClassName?: string;
  /** Slide direction on entry. Defaults to "up". */
  direction?: "up" | "left" | "right";
  /** IntersectionObserver threshold. Defaults to 0.18 */
  threshold?: number;
  priority?: boolean;
}

export default function ScrollRevealImage({
  src,
  alt,
  width,
  height,
  className,
  wrapperStyle,
  wrapperClassName,
  direction = "up",
  threshold = 0.18,
  priority = false
}: ScrollRevealImageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      {threshold}
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  const translateMap = {
    up: "translateY(28px)",
    left: "translateX(-24px)",
    right: "translateX(24px)"
  };

  const transformFrom = reduced ? "none" : translateMap[direction];
  const transformTo = "none";

  return (
    <div
      ref={ref}
      className={wrapperClassName}
      style={{
        ...wrapperStyle,
        opacity: visible ? 1 : 0,
        transform: visible ? transformTo : transformFrom,
        transition: reduced
          ? "none"
          : "opacity 0.7s ease, transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)"
      }}
    >
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        priority={priority}
      />
    </div>
  );
}
