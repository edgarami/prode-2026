const path = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    path.join(__dirname, 'src/**/*.{html,ts}'),
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00FF66',
          400: '#1aff84',
          600: '#00cc52',
        },
        dark: {
          DEFAULT: '#0d1117',
          300: '#0d1117',
        },
        surface: {
          DEFAULT: '#1a2130',
          light:   '#1f2940',
          dark:    '#111820',
        },
      },
      animation: {
        'fade-in':  'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity:'0' }, '100%': { opacity:'1' } },
        slideUp: { '0%': { transform:'translateY(10px)',opacity:'0' }, '100%': { transform:'translateY(0)',opacity:'1' } },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};
