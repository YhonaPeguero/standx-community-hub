"use client";

import {useEffect, useImperativeHandle, useRef, useState, type Ref} from "react";
import type {
  HologramMood,
  HologramSceneHandle,
  MotionPreference
} from "@/lib/hologram-scene";
import type {MotionTrigger} from "@/lib/mascot/motion";

export type HologramMotionPreference = MotionPreference;

/**
 * What the widget can ask the character to do. Deliberately narrow: the mascot
 * reacts to interaction, it is not a puppet the chat drives frame by frame.
 */
export interface HologramHandle {
  /** Look at an element. `null` goes back to wandering. */
  lookAt: (element: Element | null, weight?: number) => void;
  /** 0..1 arousal. Decays on its own. */
  setInterest: (interest: number) => void;
  /** One-shot acknowledgement. */
  beat: (event: MotionTrigger) => void;
}

interface HologramStageProps {
  mood: HologramMood;
  active: boolean;
  motionPreference?: HologramMotionPreference;
  /** Tracks the pointer so the mascot's eye follows the visitor. */
  trackPointer?: boolean;
  className?: string;
  handleRef?: Ref<HologramHandle>;
}

/**
 * Mounts the WebGL projection. Purely decorative — the widget around it carries
 * all the semantics, so this stays `aria-hidden`. If WebGL is unavailable the
 * CSS fallback silhouette below shows instead.
 */
export default function HologramStage({
  mood,
  active,
  motionPreference = "system",
  trackPointer = true,
  className,
  handleRef
}: HologramStageProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<HologramSceneHandle | null>(null);
  const moodRef = useRef<HologramMood>(mood);
  const activeRef = useRef<boolean>(active);
  const preferenceRef = useRef<HologramMotionPreference>(motionPreference);
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
        const scene = createHologramScene({
          container,
          motionPreference: preferenceRef.current
        });
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
    // Intentionally mount-only. The motion preference is applied through a
    // runtime setter below: keying this effect on it rebuilt the WebGL context
    // and reset every spring, which read as a hard cut mid-toggle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    preferenceRef.current = motionPreference;
    sceneRef.current?.setMotionPreference(motionPreference);
  }, [motionPreference]);

  useImperativeHandle(
    handleRef,
    () => ({
      lookAt: (element, weight = 1) => {
        sceneRef.current?.lookAt(
          element ? element.getBoundingClientRect() : null,
          weight
        );
      },
      setInterest: (interest) => sceneRef.current?.setInterest(interest),
      beat: (event) => sceneRef.current?.beat(event)
    }),
    []
  );

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
      data-motion={motionPreference}
    />
  );
}
