/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      colors: {
        paper: { DEFAULT: '#F6F7F4' },
        white: '#FFFFFF',
        ink: { dark: '#1B2333', mid: '#3D4A5C', light: '#6B7280' },
        marigold: {
          DEFAULT: '#F5A623',
          light: '#FBE7C4',
          mid: '#EFC88A',
          dark: '#7A4F00',
          50: '#FEF8EB',
          100: '#FBE7C4',
          200: '#F9DCA8',
          300: '#F7D08D',
          400: '#EFC88A',
          500: '#F5A623',
          600: '#DD9216',
          700: '#7A4F00',
          800: '#5F3D00',
          900: '#442C00',
        },
        teal: {
          DEFAULT: '#1D9E75',
          light: '#E1F5EE',
          dark: '#085041',
          50: '#F0FAF7',
          100: '#E1F5EE',
          200: '#C2ECE0',
          300: '#A4E2CE',
          400: '#67CFAC',
          500: '#1D9E75',
          600: '#1A8E69',
          700: '#085041',
          800: '#063F33',
          900: '#042D25',
        },
        border: { DEFAULT: '#E1E2DC', strong: '#C8C9C2' },
        danger: { DEFAULT: '#E24B4A', bg: '#FCEBEB', dark: '#501313' }
      },
      borderRadius: {
        'wm': '12px',
        'wm-sm': '8px',
      },
    },
  },
  plugins: [],
}
