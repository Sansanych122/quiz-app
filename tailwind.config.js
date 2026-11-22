/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        brand: {
          dark: '#152A32',
          'dark-hover': '#1F3C47',
          cream: '#FFFCEE',
          'cream-card': '#FFFFFF',
          'cream-subtle': '#F8F5E6',
          sage: '#6E825E',
          'sage-hover': '#5D6E50',
          'sage-dark': '#4F6141',
          'sage-light': 'rgba(110, 130, 94, 0.14)',
          terracotta: '#B5543F',
          'terracotta-hover': '#9E4532',
          'terracotta-light': 'rgba(181, 84, 63, 0.12)',
        },
        background: '#FFFCEE',
        surface: '#FFFFFF',
        primary: '#152A32',
        accent: '#6E825E',
        textMain: '#152A32',
        textMuted: 'rgba(21, 42, 50, 0.65)',
        textSubtle: 'rgba(21, 42, 50, 0.42)',
      },
      borderRadius: {
        'card': '20px',
        'btn': '12px',
        'input': '12px',
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(21, 42, 50, 0.05)',
        'soft-hover': '0 8px 30px rgba(21, 42, 50, 0.08)',
        'glass': '0 4px 20px rgba(21, 42, 50, 0.04)',
      }
    },
  },
  plugins: [],
}
