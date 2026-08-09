import type {Variants} from "framer-motion";

/**
 * Motion tokens.
 *
 * One curve set and one duration scale for the whole site, mirrored in
 * `app/globals.css` as `--ease-*` / `--dur-*` so a CSS transition and a
 * framer-motion transition describing the same gesture land on the same timing.
 * Nothing here bounces: overshoot reads as a toy, and this is a trading deck.
 *
 * Rule of thumb — things entering use `out` (fast commit, long settle), things
 * leaving use `in` (accelerate away, never linger) and are roughly half the
 * duration of their entrance. Asymmetry is what makes a UI feel responsive
 * rather than sluggish.
 */
export const ease = {
  /** Default entrance. Expo-ish: covers most of the distance immediately. */
  out: [0.22, 1, 0.36, 1],
  /** Gentler entrance for large travel, where `out` reads too abrupt. */
  outSoft: [0.16, 0.84, 0.44, 1],
  /** Symmetric — for state swaps that read the same in both directions. */
  inOut: [0.65, 0, 0.35, 1],
  /** Exits. Never used for entrances. */
  in: [0.4, 0, 1, 1]
} as const;

export const duration = {
  /** Hover/press feedback — below this a transition reads as a jump-cut. */
  instant: 0.14,
  /** Exits, small state swaps. */
  fast: 0.2,
  /** The default. Buttons, chips, panels changing state. */
  base: 0.28,
  /** Element entrances with real travel. */
  slow: 0.44,
  /** Full-surface entrances (the projection chamber, route changes). */
  scene: 0.62
} as const;

export const sectionRevealVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 24
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: ease.out
    }
  }
};

export const sectionRevealReducedVariants: Variants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.01
    }
  }
};

export const staggerContainerVariants: Variants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05
    }
  }
};

export const staggerItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 18
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: duration.slow,
      ease: ease.out
    }
  }
};

export const staggerItemReducedVariants: Variants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.01
    }
  }
};

export const cardHoverTransition = {
  type: "spring" as const,
  stiffness: 240,
  damping: 22,
  mass: 0.6
};

export const drawerBackdropVariants: Variants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      duration: duration.fast,
      ease: ease.out
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.18,
      ease: ease.in
    }
  }
};

export const drawerPanelVariants: Variants = {
  hidden: {
    x: "100%"
  },
  visible: {
    x: 0,
    transition: {
      duration: duration.base,
      ease: ease.out
    }
  },
  exit: {
    x: "100%",
    transition: {
      duration: duration.fast,
      ease: ease.in
    }
  }
};

/* -------------------------------------------------------------------------- */
/* Hologram assistant                                                          */
/* -------------------------------------------------------------------------- */

/**
 * The chamber is choreographed, not cross-faded: the scrim dims the page, the
 * mesh settles in behind it, the projection rises and stands up, and only then
 * does the console deck slide in under it. Delays are explicit rather than
 * `staggerChildren` because the visual order (scrim, mesh, projection, deck,
 * rail) is not the DOM order — the rail sits at the top of the markup but is
 * the last thing that should arrive.
 */
export interface AgentMotion {
  /**
   * Owns the exit fade and nothing else. It has to animate a real value:
   * `AnimatePresence` keeps the tree mounted until its direct child reports an
   * exit animation complete, and a variant that resolves to `{}` never does —
   * the chamber's children all fade out and the overlay stays in the DOM
   * forever. The entrance is 10ms so the layered choreography below still
   * reads as the entrance.
   */
  overlay: Variants;
  scrim: Variants;
  mesh: Variants;
  rail: Variants;
  stage: Variants;
  deck: Variants;
  /** Rows inside the deck, staggered by their parent. */
  row: Variants;
}

export const agentMotion: AgentMotion = {
  overlay: {
    hidden: {opacity: 0},
    visible: {opacity: 1, transition: {duration: 0.01}},
    exit: {opacity: 0, transition: {duration: 0.24, ease: ease.in}}
  },
  scrim: {
    hidden: {opacity: 0},
    visible: {opacity: 1, transition: {duration: duration.base, ease: ease.out}},
    exit: {opacity: 0, transition: {duration: duration.fast, ease: ease.in}}
  },
  mesh: {
    hidden: {opacity: 0, scale: 1.05},
    visible: {
      opacity: 1,
      scale: 1,
      transition: {duration: 0.78, ease: ease.outSoft, delay: 0.04}
    },
    exit: {opacity: 0, transition: {duration: 0.16, ease: ease.in}}
  },
  rail: {
    hidden: {opacity: 0, y: -10},
    visible: {
      opacity: 1,
      y: 0,
      transition: {duration: duration.slow, ease: ease.out, delay: 0.2}
    },
    exit: {opacity: 0, y: -6, transition: {duration: 0.16, ease: ease.in}}
  },
  stage: {
    hidden: {opacity: 0, y: 28, scale: 0.93},
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {duration: duration.scene, ease: ease.outSoft, delay: 0.06}
    },
    exit: {
      opacity: 0,
      y: 16,
      scale: 0.96,
      transition: {duration: duration.fast, ease: ease.in}
    }
  },
  deck: {
    hidden: {opacity: 0, y: 26},
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.46,
        ease: ease.out,
        delay: 0.12,
        // Deliberately not `when: "beforeChildren"` — the rows should fade up
        // while the deck is still sliding, not after it has parked. Waiting
        // pushes the composer past 850ms, which is long enough to feel stuck.
        staggerChildren: 0.045,
        delayChildren: 0.16
      }
    },
    exit: {opacity: 0, y: 14, transition: {duration: 0.18, ease: ease.in}}
  },
  row: {
    hidden: {opacity: 0, y: 10},
    visible: {opacity: 1, y: 0, transition: {duration: 0.38, ease: ease.out}}
  }
};

/**
 * Reduced motion: the chamber still needs to arrive and leave — an instant
 * swap of a full-viewport surface is its own kind of jarring — but nothing
 * translates or scales. Safe to branch on, because this subtree only ever
 * mounts after a click and therefore never server-renders. See AGENTS.md.
 */
export const agentMotionReduced: AgentMotion = {
  overlay: {
    hidden: {opacity: 0},
    visible: {opacity: 1, transition: {duration: 0.01}},
    exit: {opacity: 0, transition: {duration: 0.14}}
  },
  scrim: {
    hidden: {opacity: 0},
    visible: {opacity: 1, transition: {duration: 0.16}},
    exit: {opacity: 0, transition: {duration: 0.12}}
  },
  mesh: {
    hidden: {opacity: 0},
    visible: {opacity: 1, transition: {duration: 0.16}},
    exit: {opacity: 0, transition: {duration: 0.12}}
  },
  rail: {
    hidden: {opacity: 0},
    visible: {opacity: 1, transition: {duration: 0.16}},
    exit: {opacity: 0, transition: {duration: 0.12}}
  },
  stage: {
    hidden: {opacity: 0},
    visible: {opacity: 1, transition: {duration: 0.16}},
    exit: {opacity: 0, transition: {duration: 0.12}}
  },
  deck: {
    hidden: {opacity: 0},
    visible: {opacity: 1, transition: {duration: 0.16}},
    exit: {opacity: 0, transition: {duration: 0.12}}
  },
  row: {
    hidden: {opacity: 1},
    visible: {opacity: 1, transition: {duration: 0.01}}
  }
};

/** First-visit nudge next to the dock. */
export const agentHintVariants: Variants = {
  hidden: {opacity: 0, y: 10, scale: 0.98},
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {duration: duration.slow, ease: ease.out}
  },
  exit: {
    opacity: 0,
    y: 6,
    scale: 0.98,
    transition: {duration: duration.instant, ease: ease.in}
  }
};

/** Transcript turns as they stream in. */
export const agentTurnVariants: Variants = {
  hidden: {opacity: 0, y: 8},
  visible: {
    opacity: 1,
    y: 0,
    transition: {duration: 0.34, ease: ease.out}
  }
};
