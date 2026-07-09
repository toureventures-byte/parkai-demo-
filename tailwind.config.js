/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#05070d",
          900: "#0a0e1a",
          850: "#0d1220",
          800: "#111827",
          700: "#1a2236",
          600: "#232d45",
          500: "#2e3a56",
        },
        electric: {
          50: "#eef6ff",
          100: "#d9ecff",
          200: "#b9dcff",
          300: "#87c5ff",
          400: "#4ea4ff",
          500: "#2483ff",
          600: "#0d63f5",
          700: "#0850d6",
          800: "#0c42ab",
          900: "#103a86",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(36,131,255,0.15), 0 8px 24px -4px rgba(36,131,255,0.25)",
        card: "0 1px 2px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)",
      },
      backgroundImage: {
        "grid-glow":
          "radial-gradient(circle at 50% 0%, rgba(36,131,255,0.15), transparent 60%)",
      },
    },
  },
  plugins: [],
};
