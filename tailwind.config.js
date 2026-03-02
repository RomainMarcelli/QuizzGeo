/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ["Bricolage Grotesque", "Segoe UI", "sans-serif"],
        display: ["Fraunces", "serif"],
      },
    },
  },
  plugins: [],
};
