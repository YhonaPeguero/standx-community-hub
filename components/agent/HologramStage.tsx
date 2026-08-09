"use client";

import {useEffect, useRef, useState} from "react";
import type {HologramMood, HologramSceneHandle} from "@/lib/hologram-scene";

interface HologramStageProps {
  mood: HologramMood;
  active: boolean;
  /** Tracks the pointer so the mascot's eye follows the visitor. */
  trackPointer?: boolean;
  className?: string;
}

/**
 * Mounts the WebGL projection. Purely decorative — the widget around it carries
 * all the semantics, so this stays `aria-hidden`. If WebGL is unavailable the
 * CSS fallback silhouette below shows instead.
 */
export default function HologramStage({
  mood,
  active,
  trackPointer = true,
  className
}: HologramStageProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<HologramSceneHandle | null>(null);
  const moodRef = useRef<HologramMood>(mood);
  const activeRef = useRef<boolean>(active);
  const [webglFailed, setWebglFailed] = useState(false);

  // three.js is ~300KB and this widget is decorative, so the scene module is
  // pulled in after hydration rather than bundled into first load. Until it
  // lands the CSS fallback silhouette holds the space.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    let cancelled = false;

    void import("@/lib/hologram-scene")
      .then(({createHologramScene}) => {
        if (cancelled) {
          return;
        }
        const scene = createHologramScene({container});
        sceneRef.current = scene;

        if (scene.webglAvailable) {
          // Apply whatever state arrived while the module was loading.
          scene.setMood(moodRef.current);
          scene.setActive(activeRef.current);
        } else {
          setWebglFailed(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setWebglFailed(true);
        }
      });

    return () => {
      cancelled = true;
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    moodRef.current = mood;
    sceneRef.current?.setMood(mood);
  }, [mood]);

  useEffect(() => {
    activeRef.current = active;
    sceneRef.current?.setActive(active);
  }, [active]);

  useEffect(() => {
    if (!trackPointer) {
      sceneRef.current?.setPointer(0, 0);
      return;
    }

    const container = containerRef.current;
    if (!container) {
      return;
    }

    const onPointerMove = (event: PointerEvent): void => {
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        return;
      }
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      // Normalise against a generous radius so the eye drifts rather than snaps.
      const radius = Math.max(window.innerWidth, window.innerHeight) * 0.45;
      sceneRef.current?.setPointer(
        (event.clientX - centerX) / radius,
        (event.clientY - centerY) / radius
      );
    };

    window.addEventListener("pointermove", onPointerMove, {passive: true});
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, [trackPointer]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`hologram-stage ${webglFailed ? "hologram-stage--fallback" : ""} ${
        className ?? ""
      }`}
      data-mood={mood}
    />
  );
}
