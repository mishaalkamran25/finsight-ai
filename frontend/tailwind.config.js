/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy:   { 950:"#07101E", 900:"#0E1E32", 800:"#162744", 700:"#1E3358", 600:"#274270", 500:"#3A5A8C" },
        forest: { 700:"#0F4A2D", 600:"#1A6B45", 500:"#22885A", 400:"#2EA872", muted:"#D4EDE1" },
        stone:  { 50:"#FAFAF7", 100:"#F4F3EF", 200:"#EAE8E2", 300:"#D6D3CA", 400:"#B8B4A8", 500:"#8C8880" },
        crimson:{ 600:"#8B2E2E", 500:"#B03A3A", muted:"#F5DADA" },
        canvas: "#FDFCF9",
        ink:    "#0F1923",
      },
      fontFamily: {
        serif: ["'Libre Baskerville'", "Georgia", "serif"],
        sans:  ["'DM Sans'", "system-ui", "sans-serif"],
        mono:  ["'IBM Plex Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};
