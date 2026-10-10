/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#030d08",
          900: "#06150e",
          850: "#091c13",
          800: "#0c2419",
          700: "#123323",
          600: "#19432f",
          500: "#21543c",
        },
        electric: {
          50: "#ecfdf5",
          100: "#d3fae7",
          200: "#a9f3d1",
          300: "#74e8b6",
          400: "#45d99b",
          500: "#22c483",
          600: "#14a16b",
          700: "#118058",
          800: "#126548",
          900: "#11533d",
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
        glow: "0 0 0 1px rgba(69,217,155,0.15), 0 8px 24px -4px rgba(69,217,155,0.25)",
        card: "0 1px 2px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)",
      },
      backgroundImage: {
        "grid-glow":
          "radial-gradient(circle at 50% 0%, rgba(69,217,155,0.13), transparent 60%)",
      },
    },
  },
  plugins: [],
};
