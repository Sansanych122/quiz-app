/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        background: '#f5f5f7', // Світлий Apple-style фон
        surface: 'rgba(255, 255, 255, 0.7)', // Для glassmorphism
        primary: '#007aff', // iOS синій
        textMain: '#1d1d1f', // М'який чорний
        textMuted: '#86868b',
      },
      boxShadow: {
        'glass': '0 4px 30px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}