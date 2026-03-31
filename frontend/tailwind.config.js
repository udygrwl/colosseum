/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        accent: '#D97706',
        'dark-bg': '#1A1A2E',
        'dark-card': '#16213E',
        'dark-text': '#E2E8F0',
      }
    },
  },
  plugins: [],
}
