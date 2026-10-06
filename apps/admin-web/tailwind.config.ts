import type { Config } from "tailwindcss";

// "Console" — a third, distinct design direction from hospital-web's warm-paper "Editorial"
// and patient-mobile's coral/navy "Vivid & Energetic". Utilitarian and data-review-forward:
// cool slate neutrals, one indigo accent for the actions that actually matter (verify/reject/
// deactivate), monospace for anything identifying (IDs, timestamps, registration numbers).
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#F3F4F6",
        surface: "#FFFFFF",
        ink: "#1B1F27",
        "ink-muted": "#6B7280",
        border: "#E2E5EA",
        "border-strong": "#C7CCD4",
        accent: "#4F46E5",
        "accent-hover": "#4338CA",
        status: {
          available: "#15803D",
          limited: "#B45309",
          unavailable: "#B91C1C",
          unknown: "#6B7280",
        },
      },
      fontFamily: {
        sans: ['"Public Sans"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      borderRadius: {
        DEFAULT: "4px",
        sm: "2px",
        md: "4px",
        lg: "6px",
      },
      boxShadow: {
        none: "none",
      },
    },
  },
  plugins: [],
} satisfies Config;
