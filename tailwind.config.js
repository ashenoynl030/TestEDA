/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        arcadis: {
          green: '#00AA55',
          dark: '#003D2E',
          light: '#E8F5EE',
          blue: '#0066CC',
          orange: '#FF6600',
          gray: '#F5F5F5',
        }
      }
    },
  },
  plugins: [],
}
