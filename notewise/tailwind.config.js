/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand palette — warm neutrals with a signature accent
        brand: {
          50:  '#FFF8F0',
          100: '#FFEFD6',
          200: '#FFDAA8',
          300: '#FFC170',
          400: '#FFA53E',
          500: '#FF8B16',
          600: '#E67300',
          700: '#BF5A00',
          800: '#994700',
          900: '#733500',
          950: '#4D2300',
        },
        // Surface colors for layered UI
        surface: {
          0:   'var(--surface-0)',
          1:   'var(--surface-1)',
          2:   'var(--surface-2)',
          3:   'var(--surface-3)',
        },
        // Semantic text
        txt: {
          primary:   'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary:  'var(--text-tertiary)',
          inverse:   'var(--text-inverse)',
        },
        // Semantic borders
        edge: {
          DEFAULT: 'var(--border-default)',
          subtle:  'var(--border-subtle)',
          strong:  'var(--border-strong)',
        },
        // Status colors
        status: {
          success: '#34D399',
          warning: '#FBBF24',
          error:   '#F87171',
          info:    '#60A5FA',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'glow-sm': '0 0 8px rgba(255, 139, 22, 0.15)',
        'glow':    '0 0 16px rgba(255, 139, 22, 0.2)',
        'glow-lg': '0 0 32px rgba(255, 139, 22, 0.25)',
        'card':    '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
        'float':   '0 8px 30px rgba(0, 0, 0, 0.12)',
      },
      animation: {
        'fade-in':    'fadeIn 0.2s ease-out',
        'slide-up':   'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in':   'scaleIn 0.15s ease-out',
        'shimmer':    'shimmer 2s infinite linear',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%':   { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
