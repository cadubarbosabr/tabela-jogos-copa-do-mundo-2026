/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,html,css}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Syne', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        wc: {
          navy: '#070b18',
          blue: '#2f6bff',
          gold: '#d4af37',
          red: '#e11d48',
          emerald: '#10b981',
          amber: '#f59e0b',
        },
      },
      borderRadius: {
        'wc': '1.25rem',
        'wc-lg': '1.5rem',
      },
      boxShadow: {
        'wc': '0 14px 36px rgb(15 23 42 / 0.08)',
        'wc-glow': '0 10px 28px rgb(47 107 255 / 0.22)',
      },
    },
  },
  plugins: [],
}
