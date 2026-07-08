import type { Config } from "tailwindcss";

/**
 * JIU brand palette — navy is the primary (per the JIU Color Swatch), with the
 * logo's gold / green / purple as accents. Poppins is the brand typeface, wired
 * through the `--font-poppins` CSS variable set in the root layout.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#eef1f9",
          100: "#d5dcf0",
          200: "#aab8e0",
          300: "#7f94d1",
          400: "#5470c1",
          500: "#2f4ba7",
          600: "#253c86",
          700: "#1e2f6d", // primary
          800: "#16224f",
          900: "#0e1633",
        },
        gold: {
          DEFAULT: "#f6c945",
          400: "#f8d569",
          600: "#e0b02f",
        },
        brandgreen: "#3a9069",
        brandpurple: "#6f2c91",
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(14, 22, 51, 0.08), 0 1px 2px rgba(14, 22, 51, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
