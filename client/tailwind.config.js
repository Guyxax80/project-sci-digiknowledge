/** @type {import('tailwindcss').Config} */
module.exports = {
content: [
  "./src/**/*.{js,jsx,ts,tsx,html}",
  "./public/index.html"
],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f4f7fb',
          100: '#e9eff7',
          200: '#cfddee',
          300: '#a7c3e0',
          400: '#7fa6d2',
          500: '#5e8fc6',
          600: '#3e73b7',
          700: '#2f5a95',
          800: '#284a79',
          900: '#213c61',
        },
        accent: {
          50: '#fef6f2',
          100: '#fde8dc',
          200: '#fbd2bb',
          300: '#f6b18c',
          400: '#ee8a5e',
          500: '#e36a39',
          600: '#c94f24',
          700: '#a03e1d',
          800: '#7c321a',
          900: '#612a18',
        },
        surface: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Ubuntu", "Cantarell", "Noto Sans Thai", "Noto Sans", "Helvetica Neue", "Arial", "sans-serif"],
        display: ["Inter", "Noto Sans Thai", "ui-sans-serif", "system-ui"],
      },
      borderRadius: {
        xl: '1rem',
      },
      boxShadow: {
        soft: '0 10px 30px rgba(31, 41, 55, 0.08)'
      }
    },
  },
  plugins: [],
}