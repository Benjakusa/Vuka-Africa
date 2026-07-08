/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './index.html',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF5349',
          50: '#FFF3F2',
          100: '#FFE0DE',
          200: '#FFC2BC',
          300: '#FF9C93',
          400: '#FF766B',
          500: '#FF5349',
          600: '#E0483F',
          700: '#C43D35',
          800: '#A8322B',
          900: '#8C2722',
        },
        dark: '#1A1A1A',
        body: '#4B5563',
        surface: '#F5F5F5',
        warning: {
          DEFAULT: '#F59E0B',
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          500: '#F59E0B',
        },
        destructive: {
          DEFAULT: '#EF4444',
          50: '#FEF2F2',
          100: '#FEE2E2',
        },
        accent: {
          DEFAULT: '#F3F4F6',
          foreground: '#1A1A1A',
        },
        muted: {
          DEFAULT: '#9AA3AF',
          foreground: '#6B7280',
        },
        border: '#E5E7EB',
        input: '#E5E7EB',
        ring: '#FF5349',
        background: '#FAFAFA',
        foreground: '#1A1A1A',
        card: '#FFFFFF',
        'card-foreground': '#1A1A1A',
        popover: '#FFFFFF',
        'popover-foreground': '#1A1A1A',
      },
      borderRadius: {
        btn: '0.5rem',
        card: '0.75rem',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        cardHover: '0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.08)',
        modal: '0 20px 25px -5px rgb(0 0 0 / 0.15), 0 8px 10px -6px rgb(0 0 0 / 0.15)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
