"use client";

import {useEffect, useRef, useState} from "react";
import {createThreeScene} from "@/lib/three-scene";

export default function HeroCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const scene = createThreeScene({container: containerRef.current});
    setShowFallback(!scene.webglAvailable);

    return () => {
      scene.dispose();
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      role="presentation"
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
    >
      <div ref={containerRef} className="absolute inset-0" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_40%,rgba(0,212,255,0.1)_0%,rgba(138,92,255,0.06)_40%,rgba(5,7,15,0.55)_80%,rgba(5,7,15,0.85)_100%)]" />
      {showFallback ? (
        <div className="hero-grid-fallback absolute inset-0" />
      ) : null}
    </div>
  );
}
