/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17231f",
        canopy: "#176b5b",
        moss: "#5b7f46",
        ember: "#d75d2a",
        haze: "#f4f7f1",
      },
      boxShadow: {
        panel: "0 18px 60px rgba(23, 35, 31, 0.12)",
      },
    },
  },
  plugins: [],
};
