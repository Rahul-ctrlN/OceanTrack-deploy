/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          800: "#1e293b",
          900: "#0f172a",
        },
        ocean: {
          50: "#eff8ff",
          100: "#dbeefe",
          400: "#38a9e4",
          500: "#1a8cd8",
          600: "#0f6fb3",
          700: "#0d5990",
        },
      },
    },
  },
  plugins: [],
};