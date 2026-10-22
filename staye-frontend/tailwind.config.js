/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#020617",
          900: "#0F172A",
          800: "#1E293B",
          700: "#334155",
        },
        brand: {
          DEFAULT: "#334155",
          hover: "#0F172A",
          light: "#F1F5F9",
        },
        accent: {
          DEFAULT: "#F1F5F9",
          dark: "#E2E8F0",
        },
        success: "#059669",
        danger: "#B91C1C",
        coral: "#FF385C",
        ink: {
          900: "#0F172A",
          700: "#334155",
          500: "#64748B",
          300: "#CBD5E1",
        },
      },
      fontFamily: {
        sans: [
          "Plus Jakarta Sans",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 4px 12px -2px rgba(15,23,42,0.08), 0 2px 4px -1px rgba(15,23,42,0.03)",
        popover: "0 12px 32px -4px rgba(15,23,42,0.12), 0 4px 12px -2px rgba(15,23,42,0.04)",
      },
      borderRadius: {
        sm: "10px",
      },
    },
  },
  plugins: [],
};
