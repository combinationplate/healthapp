import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0B1222",
        "ink-soft": "#3B4963",
        "ink-muted": "#7A8BA8",
        cream: "#F6F5F0",
        sage: "#E8EDE6",
        blue: "#2455FF",
        "blue-dark": "#1A3FCC",
        teal: "#0D9488",
        "teal-dark": "#0F766E",
        coral: "#E8604C",
        gold: "#D4A853",
        green: "#16A34A",
        purple: "#7C3AED",
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
      },
      borderRadius: {
        pulse: "10px",
        "pulse-lg": "16px",
        "pulse-xl": "24px",
      },
      boxShadow: {
        glow: "0 4px 24px rgba(36, 85, 255, 0.25)",
        "glow-teal": "0 4px 24px rgba(13, 148, 136, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
