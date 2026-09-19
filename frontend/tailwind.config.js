/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Hanken Grotesk"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        brand: {
          50: '#f0f6fc',
          100: '#e3f2fd',
          200: '#bbdefb',
          300: '#90caf9',
          400: '#64b5f6',
          500: '#2196f3',
          600: '#1e88e5',
          700: '#1976d2',
          800: '#1565c0',
          900: '#0d47a1',
          950: '#072b68',
        },
        surface: {
          card: '#ffffff',
          subtle: '#f8fafc',
          border: '#d0e2f5',
          borderLight: '#e2edf8',
        },
        cyber: {
          emerald: '#059669',
          emeraldBg: '#ecfdf5',
          cyan: '#0284c7',
          amber: '#d97706',
          rose: '#dc2626',
        },
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'subtle-card': '0 1px 3px 0 rgba(13, 71, 161, 0.06), 0 1px 2px -1px rgba(13, 71, 161, 0.04)',
        'card-hover': '0 4px 12px 0 rgba(13, 71, 161, 0.08)',
        'glow-cyan': '0 0 16px -2px rgba(33, 150, 243, 0.35)',
        'glow-emerald': '0 0 18px -2px rgba(16, 185, 129, 0.35)',
        'glow-rose': '0 0 18px -2px rgba(239, 68, 68, 0.25)',
      },
    },
  },
  plugins: [],
}
