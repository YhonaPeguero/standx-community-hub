"use client";

import {useEffect, useRef, useState} from "react";

/**
 * Decorative hero backdrop.
 *
 * Renders a muted looping video behind the hero on any device that supports it.
 * On reduced-motion or saveData, it quietly hides so the aurora + grid layers
 * are the only ambient texture.
 *
 * Pointer-events are disabled and the element is marked aria-hidden; this is
 * strictly decorative.
 */
export default function HeroBackdrop() {
  const [enabled, setEnabled] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const saveData =
      // @ts-expect-error - connection is non-standard but widely available
      typeof navigator !== "undefined" && navigator.connection?.saveData === true;

    if (!prefersReducedMotion && !saveData) {
      setEnabled(true);
    }
  }, []);

  if (!enabled) {
    return null;
  }

  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="/assets/standxProfile.png"
        className="absolute inset-0 h-full w-full object-cover opacity-[0.14]"
        style={{
          filter: "blur(2px) contrast(1.05) saturate(1.2) hue-rotate(-6deg)",
          transform: "scale(1.04)"
        }}
        onError={() => setEnabled(false)}
      >
        <source src="/assets/video-standx.mp4" type="video/mp4" />
      </video>
      {/* Multi-stop gradient veil: stronger at edges/top so text stays readable */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(5,7,15,0.72) 0%, rgba(5,7,15,0.52) 40%, rgba(5,7,15,0.68) 80%, rgba(5,7,15,0.80) 100%)"
        }}
      />
      {/* Side vignettes for extra depth */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 55%, rgba(5,7,15,0.55) 100%)"
        }}
      />
    </div>
  );
}
