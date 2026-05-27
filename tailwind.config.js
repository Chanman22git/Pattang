/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#1a1a1a",
          muted: "#6b6b6b",
        },
        paper: "#fbfaf7",
        accent: "#8a2a2a", // deep maroon — courtroom-adjacent, not loud
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["Source Serif Pro", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
