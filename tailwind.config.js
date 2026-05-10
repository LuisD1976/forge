/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        forge: {
          black: '#0D0D0F',
          iron: '#18181C',
          border: '#2A2A30',
          orange: '#FF6B1A',
          'orange-light': '#FFA052',
          white: '#F5F5F0',
          green: '#4ADE80',
          red: '#EF4444',
        },
      },
      fontFamily: {
        display: ['Anton', 'Bebas Neue', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'forge-gradient': 'linear-gradient(135deg, #FF6B1A 0%, #FFA052 100%)',
        'dark-gradient': 'linear-gradient(180deg, #18181C 0%, #0D0D0F 100%)',
      },
      animation: {
        'pulse-orange': 'pulse-orange 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'rank-flash': 'rank-flash 0.5s ease-in-out',
        float: 'float 3s ease-in-out infinite',
      },
      keyframes: {
        'pulse-orange': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'rank-flash': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.2)', filter: 'brightness(1.5)' },
          '100%': { transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
