/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,vue}"],
  theme: {
    container: { center: true },
    extend: {
      fontFamily: {
        sans: ['"Noto Sans SC"', 'sans-serif'],
      },
      colors: {
        brand: {
          900: '#0d1b2a',
          800: '#1b263b',
          700: '#0F4C81',
          600: '#415a77',
          400: '#778da9',
        },
      },
    },
  },
  plugins: [],
};