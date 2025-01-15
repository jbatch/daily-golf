/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {},
      keyframes: {
        "ring-pulse": {
          "0%, 100%": {
            opacity: "0.2",
          },
          "50%": {
            opacity: "1",
          },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
