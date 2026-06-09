import type { Config } from 'tailwindcss';

// Tailwind theme is driven by the CSS variables defined in src/styles/tokens.css,
// which come verbatim from the Thmanyah brand guide. The variables are the
// single source of truth; these mappings just expose them as utilities.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        black: 'var(--color-black)',
        white: 'var(--color-white)',
        green: {
          DEFAULT: 'var(--color-green)',
          light: 'var(--color-green-light)',
          pale: 'var(--color-green-pale)',
        },
        blue: 'var(--color-blue)',
        red: 'var(--color-red)',
        burgundy: 'var(--color-burgundy)',
        amber: 'var(--color-amber)',
        peach: 'var(--color-peach)',
        mint: 'var(--color-mint)',
        sky: 'var(--color-sky-blue)',
        lavender: 'var(--color-lavender)',
        'yellow-pale': 'var(--color-yellow-pale)',
        'pink-light': 'var(--color-pink-light)',
        blush: 'var(--color-blush)',
        // neutrals
        'dark-slate': 'var(--color-dark-slate)',
        charcoal: 'var(--color-charcoal)',
        muted: 'var(--color-muted)',
        'warm-gray': 'var(--color-warm-gray)',
        cream: 'var(--color-cream)',
        'off-white': 'var(--color-off-white)',
        'warm-white': 'var(--color-warm-white)',
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
        ui: ['var(--font-ui)'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        pill: 'var(--radius-full)',
      },
      boxShadow: {
        soft: 'var(--shadow-sm)',
        card: 'var(--shadow-md)',
        float: 'var(--shadow-lg)',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-6px)' },
          '40%, 80%': { transform: 'translateX(6px)' },
        },
        shine: {
          '0%': { transform: 'translateX(-120%)' },
          '100%': { transform: 'translateX(220%)' },
        },
        floatUp: {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(-48px)', opacity: '0' },
        },
      },
      animation: {
        shake: 'shake 0.4s ease-in-out',
        shine: 'shine 1.1s ease-in-out',
        floatUp: 'floatUp 0.9s ease-out forwards',
      },
    },
  },
  plugins: [],
} satisfies Config;
