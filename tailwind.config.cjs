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
          DEFAULT: '#FF5F00',
          50: '#FFF5F0',
          100: '#FFE8D9',
          200: '#FFD1B3',
          300: '#FFBA8C',
          400: '#FFA366',
          500: '#FF8C40',
          600: '#FF751A',
          700: '#FF5F00',
          800: '#E65600',
          900: '#CC4C00',
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
        ring: '#FF5F00', // Neon Orange
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
