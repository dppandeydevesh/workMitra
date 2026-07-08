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
        serif: ['"Playfair Display"', 'Georgia', 'serif'], // Editorial serif voice
      },
      colors: {
        paper: {
          DEFAULT: '#F6F7F4',
        },
        marigold: {
          50:  '#FFFDF5',
          100: '#FBE7C4',
          200: '#F8D69A',
          300: '#F5C46F',
          400: '#F5B545',
          500: '#F5A623', // ← The single signature accent
          600: '#D98E1A',
          700: '#B47312',
          800: '#92400e',
          900: '#7A4F00',
          950: '#451a03',
        },
        ink: {
          50:  '#F8F9FA',
          100: '#F1F2EE',
          200: '#E1E2DC',
          300: '#C8C9C2',
          400: '#9CA3AF',
          500: '#6B7280', // Slate / ink-light
          600: '#3D4A5C', // Ink mid
          700: '#2D3748',
          800: '#1E2A3A',
          900: '#1B2333', // Ink dark — primary text
        },
        teal: {
          50:  '#F0FDF8',
          100: '#E1F5EE',
          200: '#B2E8D5',
          300: '#6DD5B5',
          400: '#2DB88A',
          500: '#1D9E75', // Trust / verification accent
          600: '#178764',
          700: '#116B50',
          800: '#085041',
          900: '#043D32',
        },
        danger: {
          50:  '#FEF2F2',
          100: '#FCEBEB',
          200: '#FECACA',
          400: '#F87171',
          500: '#E24B4A',
          600: '#DC2626',
          800: '#501313',
        },
      },
      borderRadius: {
        'wm': '12px',
        'wm-sm': '8px',
      },
      borderColor: {
        DEFAULT: '#E1E2DC',
      },
    },
  },
  plugins: [],
}
