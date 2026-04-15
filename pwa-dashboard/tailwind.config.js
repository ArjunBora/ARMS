/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#000000",
        foreground: "#f8fafc",
        card: "#111827",
        primary: {
          DEFAULT: "#3b82f6",
          foreground: "#ffffff",
        },
        accent: {
          DEFAULT: "#f97316",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#1e293b",
          foreground: "#94a3b8",
        },
        "health-green": "#10b981",
        "health-yellow": "#f59e0b",
        "health-red": "#ef4444",
      },
      fontFamily: {
        sans: ["var(--font-fira-sans)", "sans-serif"],
        mono: ["var(--font-fira-code)", "monospace"],
      },
    },
  },
  plugins: [],
};

module.exports = config;
