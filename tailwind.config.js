/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        primary:   { DEFAULT: '#C9A843', light: '#E2C06A', dark: '#A8872E' },
        vinotinto: { DEFAULT: '#7B1F35', light: '#9B2D47', dark: '#5A1525', deep: '#3D0E1C' },
        dark:      { DEFAULT: '#0E0608', 100: '#1A0C10', 200: '#240F15', 300: '#2E1219' },
        surface:   { DEFAULT: '#1E0E13', light: '#2A1219', dark: '#150A0D' },
        gold:      '#C9A843',
        cream:     '#F5EDD6',
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      boxShadow: {
        'gold':    '0 0 24px rgba(201,168,67,0.35)',
        'gold-sm': '0 0 12px rgba(201,168,67,0.2)',
        'card':    '0 4px 24px rgba(0,0,0,0.6)',
        'vino':    '0 0 24px rgba(123,31,53,0.4)',
      },
      animation: {
        'fade-in':  'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'float':    'float 4s ease-in-out infinite',
        'spin-slow':'spin 12s linear infinite',
        'pulse-gold':'pulseGold 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { '0%': { opacity:'0' }, '100%': { opacity:'1' } },
        slideUp:   { '0%': { transform:'translateY(14px)', opacity:'0' }, '100%': { transform:'translateY(0)', opacity:'1' } },
        float:     { '0%,100%': { transform:'translateY(0px)' }, '50%': { transform:'translateY(-10px)' } },
        pulseGold: { '0%,100%': { boxShadow:'0 0 12px rgba(201,168,67,0.3)' }, '50%': { boxShadow:'0 0 28px rgba(201,168,67,0.6)' } },
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
