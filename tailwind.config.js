/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './frontend/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#E8611A',
          50: '#FEF2EB',
          100: '#FDE1D0',
          200: '#FBC3A1',
          300: '#F8A572',
          400: '#F58743',
          500: '#E8611A',
          600: '#C94F13',
          700: '#A9400E',
          800: '#8A3309',
          900: '#6B2706',
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
        ring: '#E8611A',
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
        card: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        cardHover: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        modal: '0 20px 25px -5px rgb(0 0 0 / 0.2), 0 8px 10px -6px rgb(0 0 0 / 0.2)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
