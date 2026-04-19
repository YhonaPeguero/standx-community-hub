import type {Config} from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "#05070f",
          elevated: "#090c18",
          surface: "#0c1120",
          muted: "#121a2d"
        },
        border: {
          base: "#1a2339",
          strong: "#2a3a5c",
          hairline: "rgba(148, 184, 232, 0.08)"
        },
        text: {
          primary: "#eef6ff",
          secondary: "#a3b9cf",
          muted: "#6c819a"
        },
        accent: {
          cyan: "#00d4ff",
          cyanSoft: "#64e6ff",
          gain: "#00ff9d",
          violet: "#8a5cff",
          magenta: "#ff4da6"
        },
        signal: {
          positive: "#00ff9d",
          caution: "#ffbf4a",
          negative: "#ff5f7a"
        }
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"]
      },
      backgroundImage: {
        "gradient-brand":
          "linear-gradient(120deg, #00d4ff 0%, #64e6ff 35%, #8a5cff 75%, #ff4da6 100%)",
        "gradient-edge":
          "linear-gradient(130deg, rgba(0,212,255,0.55) 0%, rgba(138,92,255,0.45) 55%, rgba(255,77,166,0.35) 100%)",
        "gradient-muted":
          "linear-gradient(135deg, rgba(0,212,255,0.12) 0%, rgba(138,92,255,0.10) 100%)",
        "grid-fine":
          "linear-gradient(to right, rgba(120,160,210,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(120,160,210,0.06) 1px, transparent 1px)",
        "noise-soft":
          "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.025) 1px, transparent 0)"
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(0, 212, 255, 0.25), 0 12px 55px -10px rgba(0, 212, 255, 0.35)",
        "glow-violet":
          "0 0 0 1px rgba(138, 92, 255, 0.22), 0 14px 55px -12px rgba(138, 92, 255, 0.45)",
        panel: "0 20px 60px -20px rgba(4, 8, 24, 0.65)",
        "panel-hover":
          "0 30px 80px -24px rgba(0, 212, 255, 0.22), 0 0 0 1px rgba(138, 92, 255, 0.2)",
        "ring-inner": "inset 0 0 0 1px rgba(148, 184, 232, 0.08)"
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
        "pulse-dot": {
          "0%,100%": {
            boxShadow: "0 0 0 0 rgba(0, 255, 157, 0.55)",
            opacity: "1"
          },
          "50%": {
            boxShadow: "0 0 0 7px rgba(0, 255, 157, 0)",
            opacity: "0.85"
          }
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
        "locale-fade": "locale-fade 280ms ease-out",
        "ticker-shift": "ticker-shift 26s linear infinite",
        "grid-drift": "grid-drift 18s linear infinite",
        shimmer: "shimmer 2.6s linear infinite",
        float: "float 5.5s ease-in-out infinite",
        "pulse-dot": "pulse-dot 2.4s ease-in-out infinite",
        "gradient-pan": "gradient-pan 9s ease-in-out infinite",
        "aurora-drift": "aurora-drift 14s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

export default config;
