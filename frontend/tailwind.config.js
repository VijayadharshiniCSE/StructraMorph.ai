/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: "#080B11",
          surface: "#0D131F",
          card: "#121A2B",
          border: "#1E2A42",
          borderLight: "#2A3A5B",
          text: "#F1F5F9",
          muted: "#94A3B8",
          subtle: "#64748B",
        },
        light: {
          bg: "#F8F9FD",
          surface: "#FFFFFF",
          card: "#F1F4F9",
          border: "#E2E8F0",
          borderLight: "#CBD5E1",
          text: "#0F172A",
          muted: "#475569",
          subtle: "#94A3B8",
        },
        surgical: {
          DEFAULT: "#10B981",
          light: "#34D399",
          dark: "#059669",
          glow: "rgba(16, 185, 129, 0.15)",
        },
        laser: {
          cyan: "#06B6D4",
          orange: "#F97316",
          violet: "#8B5CF6",
          amber: "#F59E0B",
          rose: "#F43F5E",
          purple: "#A855F7",
        },
      },
      fontFamily: {
        sans: ["'Inter'", "'Plus Jakarta Sans'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "'Fira Code'", "monospace"],
      },
      boxShadow: {
        surgical: "0 0 25px -5px rgba(16, 185, 129, 0.25)",
        glow: "0 0 25px -4px rgba(6, 182, 212, 0.35)",
        purpleGlow: "0 0 22px -3px rgba(168, 85, 247, 0.35)",
        cyanOrange: "0 0 25px -4px rgba(249, 115, 22, 0.35)",
        card: "0 10px 30px -10px rgba(0, 0, 0, 0.5)",
      },
      borderRadius: {
        DEFAULT: "6px",
      },
    },
  },
  plugins: [],
};
