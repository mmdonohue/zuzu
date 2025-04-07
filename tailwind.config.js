/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        'zuzu-primary': '#AABBE3',
        'zuzu-secondary': '#6F87BF',
        'zuzu-accent': '#FE0000',
        'zuzu-dark': '#001133',
        'zuzu-light': '#F9FAFB'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
  // This is important for working with MUI
  corePlugins: {
    preflight: false,
  },
}
