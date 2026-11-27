/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Nunito', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        bisigo: {
          blue: '#1A8CFF',
          'blue-dark': '#0066CC',
          'blue-hover': '#339BFF',
          'blue-light': '#E6F3FF',
          cobalt: '#3B5BDB',
          'cobalt-dark': '#2B44A8',
          'cobalt-hover': '#4C6EF5',
          'cobalt-light': '#EDF2FF',
          gold: '#FFC800',
          'gold-dark': '#E5B400',
          'gold-light': '#FFF8DB',
          orange: '#FF9600',
          'orange-dark': '#CC7800',
          mint: '#12B886',
          'mint-dark': '#0CA678',
          'mint-light': '#E6FCF5',
          red: '#FF4B4B',
          'red-dark': '#EA2B2B',
          'red-light': '#FFDFE0',
          ink: '#1E293B',
          muted: '#64748B',
          border: '#E2E8F0',
          surface: '#F8FAFC',
          'node-lip': '#CBD5E1',
          disabled: '#94A3B8',
        },
      },
    },
  },
  plugins: [],
};
