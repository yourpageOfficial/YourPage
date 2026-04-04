import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--color-primary)",
          hover: "var(--color-primary-hover)",
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "var(--color-primary-hover)",
          600: "var(--color-primary)",
          700: "#1D4ED8",
          800: "#1E40AF",
          900: "#1E3A8A",
        },
        secondary: {
          DEFAULT: "var(--color-secondary)",
          hover: "var(--color-secondary-hover)",
          50: "#FEFCE8",
          100: "#FEF9C3",
          200: "#FEF08A",
          300: "var(--color-secondary-hover)",
          400: "var(--color-secondary)",
          500: "#EAB308",
          600: "#CA8A04",
        },
        destructive: {
          DEFAULT: "var(--color-destructive)",
          surface: "var(--color-destructive-surface)",
          hover: "var(--color-destructive-hover)",
          50: "#FEF2F2",
          100: "#FEE2E2",
          400: "#F87171",
          500: "var(--color-destructive)",
          600: "#DC2626",
          700: "#B91C1C",
          900: "#7F1D1D",
        },
        surface: "var(--color-surface)",
        skeleton: "var(--color-skeleton)",
        border: "var(--color-border)",
        background: "var(--color-background)",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.3" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "pulse-dot": "pulse-dot 1.5s ease-in-out infinite",
        shimmer: "shimmer 2s infinite linear",
      },
    },
  },
  plugins: [],
};

export default config;
