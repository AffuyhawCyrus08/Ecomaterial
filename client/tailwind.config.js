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
        primary: '#13ec80',
        'background-light': '#f6f8f7',
        'background-dark': '#102219',
        'neutral-light': '#f0f4f2',
        'neutral-dark': '#1a2c24',
        'surface-light': '#ffffff',
        'surface-dark': '#182e24',
        'text-main': '#111814',
        'text-secondary': '#618975',
      },
      fontFamily: {
        display: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
      },
    },
  },
  plugins: [],
}
