import type { Config } from 'tailwindcss';

/**
 * Tokens measured from the reference stylesheets (see docs/REFERENCE-ANALYSIS.md).
 * Breakpoints are the normalized set of the widths the reference actually used.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    screens: {
      xs: '360px',
      sm: '500px',
      md: '600px',
      lg: '768px',
      xl: '890px',
      '2xl': '1024px',
      '3xl': '1260px',
      '4xl': '1320px',
    },
    extend: {
      colors: {
        brand: {
          DEFAULT: '#008577',
          50: '#e6f4f2',
          100: '#c0e4de',
          200: '#8fd0c7',
          300: '#5bbbae',
          400: '#2aa697',
          500: '#008577',
          600: '#00776a',
          700: '#00655a',
          800: '#00534a',
          900: '#003c35',
        },
        olive: {
          DEFAULT: '#71a200',
          light: '#8cbe1a',
          dark: '#5c8500',
        },
        gold: {
          DEFAULT: '#fccb18',
          soft: '#f5e5a8',
          pale: '#fff8a6',
          wash: '#fff9e8',
        },
        ink: {
          DEFAULT: '#222222',
          strong: '#111111',
          black: '#0a0a0a',
          muted: '#666666',
          soft: '#888888',
          faint: '#999999',
          ghost: '#b6b6b6',
        },
        line: {
          DEFAULT: '#dddddd',
          soft: '#eeeeee',
          strong: '#cccccc',
        },
        surface: {
          DEFAULT: '#ffffff',
          soft: '#f7f7f7',
          sunk: '#f2f2f2',
        },
        danger: {
          DEFAULT: '#ff0000',
          soft: '#ff5252',
        },
        info: '#53b2e5',
        // the reference paints its express-delivery marker in a hot pink-red
        quick: '#f5325b',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Noto Sans Armenian', 'Noto Sans', 'Helvetica Neue', 'Arial', 'sans-serif'],
        display: ['var(--font-display)', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        serif: ['Times New Roman', 'Times', 'serif'],
      },
      maxWidth: {
        rail: '1260px',
        wide: '1920px',
      },
      spacing: {
        rail: '1260px',
        header: '80px',
        'header-mobile': '60px',
        gnb: '50px',
      },
      borderRadius: {
        pill: '999px',
        card: '4px',
        tile: '8px',
      },
      boxShadow: {
        glass: '0 4px 30px rgba(0,0,0,0.1)',
        menu: '0 0 9px rgba(0,0,0,0.1)',
        card: '0 2px 10px rgba(0,0,0,0.06)',
        'card-hover': '0 8px 24px rgba(0,0,0,0.10)',
        strip: '1px 1px 2px rgba(0,0,0,0.1)',
      },
      backdropBlur: {
        glass: '20px',
        panel: '16px',
      },
      transitionDuration: {
        fast: '150ms',
        base: '250ms',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(.97)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        // two identical halves scroll past; -50% lands exactly on the seam
        marquee: {
          from: { transform: 'translate3d(0,0,0)' },
          to: { transform: 'translate3d(-50%,0,0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        'slow-pan': {
          '0%, 100%': { transform: 'scale(1) translate3d(0,0,0)' },
          '50%': { transform: 'scale(1.08) translate3d(-1%,1%,0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 250ms ease-out both',
        'fade-up': 'fade-up 350ms cubic-bezier(.22,.61,.36,1) both',
        'slide-down': 'slide-down 200ms ease-out both',
        'scale-in': 'scale-in 180ms ease-out both',
        shimmer: 'shimmer 1.4s linear infinite',
        marquee: 'marquee var(--marquee-duration, 60s) linear infinite',
        'slow-pan': 'slow-pan 18s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
