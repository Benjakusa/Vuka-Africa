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
          DEFAULT: '#ff3f34',
          50: '#FFF2F1',
          100: '#FFE0DE',
          200: '#FFC2BC',
          300: '#FFA49A',
          400: '#FF8678',
          500: '#ff3f34',
          600: '#E63129',
          700: '#CC2921',
          800: '#B32018',
          900: '#991710',
        },
        dark: '#000000',
        body: '#4B5563', // Grey
        surface: '#F3F4F6', // Grey
        // Map old semantic colors to approved ones to prevent missing styles before script cleanup
        warning: {
          DEFAULT: '#4B5563', // Grey fallback
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          500: '#4B5563',
        },
        destructive: {
          DEFAULT: '#000000', // Black fallback
          50: '#F9FAFB',
          100: '#F3F4F6',
        },
        success: {
          DEFAULT: '#000000', // Black fallback
          50: '#F9FAFB',
          100: '#F3F4F6',
          500: '#000000',
        },
        accent: {
          DEFAULT: '#F3F4F6', // Grey
          foreground: '#000000', // Black
        },
        muted: {
          DEFAULT: '#9CA3AF', // Grey
          foreground: '#4B5563', // Grey
        },
        border: '#E5E7EB', // Grey
        input: '#E5E7EB', // Grey
        ring: '#ff3f34', // Brand Orange
        background: '#FFFFFF', // White
        foreground: '#000000', // Black
        card: '#FFFFFF', // White
        'card-foreground': '#000000', // Black
        popover: '#FFFFFF', // White
        'popover-foreground': '#000000', // Black
      },
      borderRadius: {
        btn: '0.5rem',
        card: '0.75rem',
      },
      boxShadow: {
        card: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
