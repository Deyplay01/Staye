/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#243119",
          900: "#243119",
          800: "#46633a",
          700: "#629460",
        },
        brand: {
          DEFAULT: "#629460",
          hover: "#46633a",
          light: "#c9f2c7",
        },
        accent: {
          DEFAULT: "#aceca1",
          dark: "#96be8c",
        },
        success: "#629460",
        danger: "#a33f35",
        ink: {
          900: "#243119",
          700: "#46633a",
          500: "#629460",
          300: "#96be8c",
        },
      },
      fontFamily: {
        sans: [
          "DM Sans",
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
        card: "0 12px 30px rgba(36,49,25,0.08)",
        popover: "0 18px 46px rgba(36,49,25,0.16)",
      },
      borderRadius: {
        sm: "12px",
      },
    },
  },
  plugins: [],
};
