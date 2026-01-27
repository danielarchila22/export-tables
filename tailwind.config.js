/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",           /*CREO MODULOS DE ESTILO TAILWIND*/
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          50: '#f7f7f8',
          100: '#ececf0',
          200: '#d5d5dc',
          300: '#b1b1bd',
          400: '#87879a',
          500: '#6b6b7f',
          600: '#565668',
          700: '#474755',
          800: '#3d3d48',
          900: '#27272f',
          950: '#1a1a1f',
        },
        accent: {
          400: '#4ade8a',
          500: '#22c566',
          600: '#16a34f',
          700: '#158040',
          900: '#14532e',
        }
      },
    },
  },
  plugins: [],
}
