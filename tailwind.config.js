/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyan: {
          300: '#00ffff',
          400: '#00e5e5',
          500: '#00cccc',
          600: '#00b3b3',
        },
        purple: {
          400: '#a855f7',
          500: '#8b5cf6',
          600: '#7c3aed',
        }
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'fadeIn': 'fadeIn 0.5s ease-out forwards',
        'glitch': 'glitch 0.3s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px)', opacity: '0.3' },
          '25%': { transform: 'translateY(-20px) translateX(10px)', opacity: '0.8' },
          '50%': { transform: 'translateY(-40px) translateX(-10px)', opacity: '0.5' },
          '75%': { transform: 'translateY(-20px) translateX(-10px)', opacity: '0.8' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glitch: {
          '0%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
          '100%': { transform: 'translate(0)' },
        }
      }
    },
  },
  plugins: [],
}