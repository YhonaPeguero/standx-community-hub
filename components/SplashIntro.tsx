"use client";

import {AnimatePresence, motion} from "framer-motion";
import {useEffect, useState} from "react";

/**
 * First-impression splash intro.
 *
 * Renders a full-screen lime overlay with the StandX slogan "BE STAND" +
 * mascot. The overlay is in the SSR markup from the very first paint — no
 * waiting on JS hydration to see the lime canvas. Framer-motion takes over
 * after hydration to drive entrance/exit animations.
 *
 * Replay gating:
 * - Plays on every full page load (F5 / direct URL / new tab / new session).
 * - Does NOT replay on Next.js App Router client-side navigation, including
 *   locale switches and link clicks. The gate uses `performance.timeOrigin`
 *   (the wall-clock timestamp when this document started loading) persisted
 *   in sessionStorage. Client-side nav keeps the same timeOrigin, so the
 *   stored value matches and the splash short-circuits. F5/refresh creates
 *   a new timeOrigin → splash plays again.
 *
 * Other behaviour:
 * - prefers-reduced-motion → hidden by CSS + JS effect bails out.
 * - Click anywhere or press any key after ~500ms to dismiss early.
 * - Body scroll is locked while the splash is visible.
 * - Append `?splash=1` to the URL to force a replay (handy when iterating
 *   on timings).
 */

const STORAGE_KEY = "standx-splash-origin";
const SPLASH_MASCOT_SRC = "/assets/standx-mascot-cutout.png";
const HOLD_MS = 4400;
const EXIT_DURATION_S = 0.75;

/**
 * Synchronous decision: should the splash render on this mount?
 *
 * Returns true on SSR (so the lime canvas is in the initial HTML on real
 * page loads) and on client mounts that correspond to a fresh page load.
 * Returns false on client mounts that come from client-side navigation —
 * locale switches in particular.
 */
function shouldShowSplashInitial(): boolean {
  if (typeof window === "undefined") return true;

  try {
    if (new URLSearchParams(window.location.search).get("splash") === "1") {
      return true;
    }
  } catch {
    /* very old browsers — ignore */
  }

  try {
    const currentOrigin = String(performance.timeOrigin);
    const lastShown = sessionStorage.getItem(STORAGE_KEY);
    return lastShown !== currentOrigin;
  } catch {
    return true;
  }
}

export default function SplashIntro() {
  const [visible, setVisible] = useState<boolean>(shouldShowSplashInitial);

  // Scroll lock + auto-dismiss + skip listeners. Bound to `visible` so cleanup
  // fires the moment the splash starts to exit — without this, the body stays
  // overflow:hidden forever because this component (and its parent layout)
  // never unmount inside the App Router locale segment.
  useEffect(() => {
    if (!visible) return;
    if (typeof window === "undefined") return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(false);
      return;
    }

    // Mark this page-load as "splash shown" so locale switches and other
    // client-side nav events that may remount this component don't replay.
    try {
      sessionStorage.setItem(STORAGE_KEY, String(performance.timeOrigin));
    } catch {
      /* sessionStorage unavailable (privacy mode etc.) — best-effort skip */
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const autoDismiss = window.setTimeout(() => setVisible(false), HOLD_MS);

    const dismiss = () => setVisible(false);
    // 500ms gate before listeners attach so the click that opened the tab
    // (or any focus-shifting key) can't kill the entrance.
    const attachListeners = window.setTimeout(() => {
      window.addEventListener("click", dismiss);
      window.addEventListener("keydown", dismiss);
    }, 500);

    return () => {
      window.clearTimeout(autoDismiss);
      window.clearTimeout(attachListeners);
      window.removeEventListener("click", dismiss);
      window.removeEventListener("keydown", dismiss);
      document.body.style.overflow = prevOverflow;
    };
  }, [visible]);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="standx-splash"
          role="dialog"
          aria-label="Welcome to StandX Community Hub"
          className="splash-intro fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden bg-accent-lime"
          initial={{y: 0}}
          animate={{y: 0}}
          exit={{
            y: "-100%",
            transition: {duration: EXIT_DURATION_S, ease: [0.76, 0, 0.24, 1]}
          }}
        >
          {/* Dark grid mesh — technical texture, very faint */}
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(to right, #0a0a0a 1px, transparent 1px), linear-gradient(to bottom, #0a0a0a 1px, transparent 1px)",
              backgroundSize: "64px 64px",
              maskImage:
                "radial-gradient(ellipse 60% 60% at 50% 50%, #000 30%, transparent 80%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 60% 60% at 50% 50%, #000 30%, transparent 80%)"
            }}
          />

          {/* HUD chips — hidden on narrow screens (<sm) because the two labels
              collide horizontally on phones at 320–375px. On sm+ they live in
              the corners as supporting context. */}
          <motion.div
            initial={{opacity: 0, x: -16}}
            animate={{opacity: 0.8, x: 0}}
            exit={{opacity: 0, transition: {duration: 0.25}}}
            transition={{delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1]}}
            className="absolute left-6 top-6 hidden font-mono text-[11px] font-semibold uppercase tracking-widercaps text-black sm:inline-flex"
          >
            Standx · Community Hub
          </motion.div>

          <motion.div
            initial={{opacity: 0, x: 16}}
            animate={{opacity: 0.8, x: 0}}
            exit={{opacity: 0, transition: {duration: 0.25}}}
            transition={{delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1]}}
            className="absolute right-6 top-6 hidden items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-widercaps text-black sm:inline-flex"
          >
            <span>Initializing</span>
            <span aria-hidden="true" className="h-1.5 w-1.5 animate-pulse rounded-full bg-black" />
          </motion.div>

          <div className="flex flex-col items-center gap-6 px-6">
            {/* Wordmark + mascot: stacked on phones, paired from sm+. */}
            <div className="flex w-full max-w-6xl flex-col items-center justify-center gap-5 sm:flex-row sm:gap-8 lg:gap-10">
              <div className="w-full min-w-0 sm:flex-1">
                <BeStandWordmark />
              </div>

              <SplashMascot />
            </div>

            <motion.div
              aria-hidden="true"
              initial={{scaleX: 0}}
              animate={{scaleX: 1}}
              exit={{opacity: 0, transition: {duration: 0.2}}}
              transition={{
                delay: 1.7,
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1]
              }}
              className="h-px w-full max-w-md origin-left bg-black/40"
            />

            <motion.p
              initial={{y: 14, opacity: 0}}
              animate={{y: 0, opacity: 1}}
              exit={{opacity: 0, transition: {duration: 0.25}}}
              transition={{
                delay: 2.0,
                duration: 0.55,
                ease: [0.22, 1, 0.36, 1]
              }}
              className="font-mono text-sm font-semibold uppercase tracking-widepill text-black md:text-base"
            >
              Stand together · Build forward
            </motion.p>
          </div>

          <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 0.55}}
            exit={{opacity: 0, transition: {duration: 0.2}}}
            transition={{delay: 2.5, duration: 0.5}}
            className="absolute bottom-6 font-mono text-[10px] uppercase tracking-widercaps text-black"
          >
            Click or press any key to skip
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function SplashMascot() {
  return (
    <motion.figure
      aria-hidden="true"
      className="relative isolate flex w-[clamp(7rem,30vw,10rem)] shrink-0 items-center justify-center sm:w-[clamp(8.5rem,18vw,13rem)] lg:w-[clamp(10rem,16vw,15rem)]"
      initial={{y: 70, opacity: 0, scale: 0.72, rotate: -4}}
      animate={{y: 0, opacity: 1, scale: 1, rotate: 0}}
      exit={{
        y: -30,
        opacity: 0,
        scale: 1.08,
        transition: {duration: 0.35, ease: [0.55, 0, 0.5, 1]}
      }}
      transition={{
        delay: 1.2,
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1]
      }}
    >
      <span
        className="absolute -inset-4 -z-10 rounded-full border border-black/10 bg-white/10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
      />
      <span className="absolute inset-x-1 bottom-3 top-8 -z-10 rounded-full bg-black/10 blur-2xl" />
      <span className="absolute bottom-3 left-1/2 -z-10 h-5 w-2/3 -translate-x-1/2 rounded-full bg-black/20 blur-md" />
      <motion.img
        src={SPLASH_MASCOT_SRC}
        alt=""
        draggable={false}
        className="relative z-10 block h-auto w-full select-none object-contain drop-shadow-[0_22px_28px_rgba(0,0,0,0.28)]"
      />
    </motion.figure>
  );
}

/**
 * SVG wordmark "BE STAND" with a left-to-right reveal.
 *
 * Two stacked <text> nodes:
 *   1. Outline-only — visible from t=0 to build anticipation.
 *   2. Solid fill masked by an animated <mask> rect whose width grows from
 *      0 to 720 via SMIL <animate>.
 *
 * SMIL gives consistent behaviour inside SVG islands without relying on CSS
 * transforms whose origin can be flaky inside clip/mask elements.
 */
function BeStandWordmark() {
  return (
    <svg
      viewBox="0 0 720 160"
      preserveAspectRatio="xMidYMid meet"
      className="block h-auto w-full max-w-[min(85vw,52rem)]"
      aria-label="Be Stand"
      role="img"
    >
      <defs>
        <mask id="bestand-wipe">
          <rect x="0" y="0" width="0" height="160" fill="#ffffff">
            <animate
              attributeName="width"
              from="0"
              to="720"
              dur="1.2s"
              begin="0.25s"
              fill="freeze"
              calcMode="spline"
              keyTimes="0;1"
              keySplines="0.85 0 0.15 1"
            />
          </rect>
        </mask>
      </defs>

      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fill="none"
        stroke="#0a0a0a"
        strokeOpacity="0.22"
        strokeWidth="1.5"
        style={{
          fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
          fontSize: "140px",
          fontWeight: 900,
          letterSpacing: "0"
        }}
      >
        BE STAND
      </text>

      <g mask="url(#bestand-wipe)">
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          fill="#0a0a0a"
          style={{
            fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
            fontSize: "140px",
            fontWeight: 900,
            letterSpacing: "0"
          }}
        >
          BE STAND
        </text>
      </g>
    </svg>
  );
}
