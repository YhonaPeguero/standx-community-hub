import type {Config} from "tailwindcss";

/**
 * Trading-deck design tokens — Hyperliquid-inspired.
 *
 * Palette is intentionally monochrome with a single lime accent. Cyan/violet/
 * magenta have been removed. If you need to highlight something, escalate by
 * weight + spacing, not by adding a new hue.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Background depth scale.
        bg: {
          base: "#0a0a0a",
          elevated: "#101010",
          surface: "#131313",
          muted: "#181818"
        },
        // Hairline-first border scale. base is the default 1px stroke.
        border: {
          hairline: "#1f1f1f",
          base: "#2a2a2a",
          strong: "#3a3a3a"
        },
        // Text scale. One tier per surface.
        // Contrast against bg-base #0a0a0a:
        //   primary  ~21:1, secondary ~7.5:1, muted ~6:1.
        // Muted was bumped from #6a6a6a (3.4:1, fails AA for small text).
        text: {
          primary: "#ffffff",
          secondary: "#b0b0b0",
          muted: "#909090"
        },
        // Single accent + trading semantic signals only.
        accent: {
          // Primary brand pulse. Used for: CTAs, focus rings, live dots, hover.
          lime: "#00ff87",
          limeSoft: "#7df7ba",
          // Legacy aliases so older usages keep compiling. Migrate over time.
          cyan: "#00ff87",
          cyanSoft: "#7df7ba",
          gain: "#00ff87",
          violet: "#00ff87",
          magenta: "#ff3b5c"
        },
        signal: {
          positive: "#00ff87",
          caution: "#ffb547",
          negative: "#ff3b5c"
        }
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"]
      },
      fontSize: {
        // Huge uppercase display sizes for hero + section headings.
        "display-2xl": ["clamp(3.5rem, 9vw, 8rem)", {lineHeight: "0.92", letterSpacing: "-0.04em", fontWeight: "700"}],
        "display-xl": ["clamp(2.75rem, 6.5vw, 5.5rem)", {lineHeight: "0.95", letterSpacing: "-0.035em", fontWeight: "700"}],
        "display-lg": ["clamp(2.25rem, 5vw, 4rem)", {lineHeight: "1", letterSpacing: "-0.03em", fontWeight: "700"}],
        "display-md": ["clamp(1.75rem, 3.5vw, 2.5rem)", {lineHeight: "1.05", letterSpacing: "-0.02em", fontWeight: "600"}],
        "label-xs": ["0.6875rem", {lineHeight: "1", letterSpacing: "0.18em", fontWeight: "600"}]
      },
      letterSpacing: {
        widepill: "0.18em",
        widercaps: "0.22em"
      },
      borderRadius: {
        pill: "999px"
      },
      keyframes: {
        "locale-fade": {
          "0%": {opacity: "0"},
          "100%": {opacity: "1"}
        },
        "ticker-shift": {
          "0%": {transform: "translateX(0)"},
          "100%": {transform: "translateX(-50%)"}
        },
        "pulse-dot": {
          "0%,100%": {
            boxShadow: "0 0 0 0 rgba(0, 255, 135, 0.55)",
            opacity: "1"
          },
          "50%": {
            boxShadow: "0 0 0 7px rgba(0, 255, 135, 0)",
            opacity: "0.85"
          }
        },
        // Kept for backward-compat with legacy components still referencing them.
        // They no longer have visible effect since the matching classes were
        // simplified — animation calls are harmless.
        "grid-drift": {
          "0%": {transform: "translate3d(0, 0, 0)"},
          "100%": {transform: "translate3d(-60px, -60px, 0)"}
        },
        shimmer: {
          "0%": {backgroundPosition: "-200% 0"},
          "100%": {backgroundPosition: "200% 0"}
        },
        float: {
          "0%,100%": {transform: "translateY(0)"},
          "50%": {transform: "translateY(-4px)"}
        },
        "gradient-pan": {
          "0%,100%": {backgroundPosition: "0% 50%"},
          "50%": {backgroundPosition: "100% 50%"}
        },
        "aurora-drift": {
          "0%,100%": {transform: "translate3d(0,0,0) scale(1)", opacity: "0.55"},
          "50%": {transform: "translate3d(3%, -2%, 0) scale(1.05)", opacity: "0.8"}
        }
      },
      animation: {
        "locale-fade": "locale-fade 240ms ease-out",
        "ticker-shift": "ticker-shift 26s linear infinite",
        "pulse-dot": "pulse-dot 2.4s ease-in-out infinite",
        "grid-drift": "grid-drift 18s linear infinite",
        shimmer: "shimmer 2.6s linear infinite",
        float: "float 5.5s ease-in-out infinite",
        "gradient-pan": "gradient-pan 9s ease-in-out infinite",
        "aurora-drift": "aurora-drift 14s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

export default config;
