import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: {
          main: '#0D0D0D',
          card: '#1A1A1A',
          input: '#141414',
        },
        border: {
          DEFAULT: '#2A2A2A',
        },
        text: {
          primary: '#F5F5F5',
          secondary: '#9CA3AF',
          placeholder: '#6B7280',
        },
        primary: {
          DEFAULT: '#16A34A',
          light: '#22C55E',
        },
        danger: {
          DEFAULT: '#DC2626',
        },
        warning: {
          DEFAULT: '#D97706',
        },
        info: {
          DEFAULT: '#3B82F6',
        },
        developer: {
          DEFAULT: '#F97316',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
