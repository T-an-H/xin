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
          900: '#1b3255',
          800: '#2a4d7a',
          700: '#1565C0',
          600: '#1E88E5',
          400: '#64B5F6',
        },
      },
    },
  },
  plugins: [],
};