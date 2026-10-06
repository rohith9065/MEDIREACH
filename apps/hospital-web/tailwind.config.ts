import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FAF7F2",
        "paper-raised": "#F1ECE1",
        ink: "#20201C",
        "ink-muted": "#78766C",
        rule: "#20201C",
        "rule-subtle": "#D9D4C7",
        status: {
          available: "#3F5D3A",
          limited: "#8A5A24",
          unavailable: "#8A3324",
          unknown: "#78766C",
        },
      },
      fontFamily: {
        serif: ['"Source Serif 4"', "Georgia", "serif"],
        sans: ['"IBM Plex Sans"', "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "monospace"],
      },
      borderRadius: {
        DEFAULT: "2px",
        sm: "1px",
        md: "2px",
        lg: "3px",
      },
      boxShadow: {
        none: "none",
      },
    },
  },
  plugins: [],
} satisfies Config;
