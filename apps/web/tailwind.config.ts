import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy:    { DEFAULT: '#0B1C3E', light: '#183B56', dark: '#060E1E' },
        gold:    { DEFAULT: '#C9A84C', light: '#DFC07A', dark: '#A8872D' },
        ivory:   { DEFAULT: '#FAF8F3', dark: '#F0ECE4' },
        charcoal:{ DEFAULT: '#1E293B' },
        slate:   { DEFAULT: '#64748B', light: '#94A3B8' },
        surface: { DEFAULT: '#FFFFFF', gray: '#F8FAFC' },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        serif:   ['"Playfair Display"', 'Georgia', 'serif'],
      },
      borderRadius: {
        xl:  '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        card:  '0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)',
        modal: '0 20px 60px rgba(0,0,0,.18)',
        navy:  '0 4px 24px rgba(11,28,62,.18)',
      },
      animation: {
        'fade-in':    'fadeIn 0.2s ease-out',
        'slide-up':   'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        'slide-down': 'slideDown 0.25s ease-out',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' },                        to: { opacity: '1' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { from: { opacity: '0', transform: 'translateY(-8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};

export default config;
