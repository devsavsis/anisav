/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#FF3D5A',
          2: '#FF8A4C',
          soft: 'rgba(255,61,90,0.16)',
        },
        surface: {
          DEFAULT: '#0A0A13',
          raised: '#1C1C2C',
          card: '#161623',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'sans-serif'],
        mono: ['"Space Mono"', 'ui-monospace', 'monospace'],
      },
      backgroundImage: {
        'accent-gradient': 'linear-gradient(135deg, #FF3D5A, #FF8A4C)',
      },
    },
  },
  plugins: [],
}
