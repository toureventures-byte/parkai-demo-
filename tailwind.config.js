/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#04150f",
          900: "#061d16",
          850: "#08241b",
          800: "#0b2a20",
          700: "#113328",
          600: "#1a3b30",
          500: "#254238",
        },
        ink: "#092419",
        electric: {
          50: "#effcf5",
          100: "#c9f4dc",
          200: "#a7edc5",
          300: "#93e6b8",
          400: "#7cdda9",
          500: "#4fc68a",
          600: "#2fa86d",
          700: "#1f8a57",
          800: "#186d46",
          900: "#135639",
        },
      },
      fontFamily: {
        display: ["Manrope", "DM Sans", "sans-serif"],
        sans: [
          "DM Sans",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(124,221,169,0.15), 0 8px 24px -4px rgba(124,221,169,0.22)",
        card: "0 1px 2px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)",
      },
      backgroundImage: {
        "grid-glow":
          "radial-gradient(circle at 50% 0%, rgba(124,221,169,0.12), transparent 60%)",
      },
    },
  },
  plugins: [],
};
