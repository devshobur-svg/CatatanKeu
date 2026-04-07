/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // <-- Baris ini sangat penting!
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}