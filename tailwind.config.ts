import type { Config } from "tailwindcss";

/**
 * תצורת Tailwind v4 — תואם ל-postcss (@tailwindcss/postcss).
 * צבעי Baz OS ממופים למשתני CSS ב-globals.css (לא עיצוב לבן).
 */
export default {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        baz: {
          bg: "var(--bg)",
          surface: "var(--surface)",
          elevated: "var(--surface-elevated)",
          border: "var(--border)",
          text: "var(--text)",
          muted: "var(--muted)",
          accent: "var(--accent)",
          "accent-strong": "var(--accent-strong)",
          yellow: "var(--yellow)",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
