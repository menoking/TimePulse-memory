module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'primary': {
          50: 'rgba(var(--color-primary), 0.05)',
          100: 'rgba(var(--color-primary), 0.1)',
          200: 'rgba(var(--color-primary), 0.2)',
          300: 'rgba(var(--color-primary), 0.4)',
          400: 'rgba(var(--color-primary), 0.6)',
          500: 'rgb(var(--color-primary))',
          600: 'rgba(var(--color-primary), 0.9)',
          700: 'rgba(var(--color-primary), 0.8)',
          800: 'rgba(var(--color-primary), 0.7)',
          900: 'rgba(var(--color-primary), 0.6)',
        },
        'background': {
          light: '#ffffff',
          dark: '#121212',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      fontFamily: {
        'sans': ['Inter', 'ui-sans-serif', 'system-ui'],
        'display': ['Poppins', 'sans-serif'],
        'mono': ['Consolas', 'monospace'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'digit-slide-up': 'digitSlideUp 0.3s forwards',
        'digit-slide-down': 'digitSlideDown 0.3s forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        digitSlideUp: {
          '0%': { opacity: 1, transform: 'translateY(0)' },
          '100%': { opacity: 0, transform: 'translateY(-100%)' },
        },
        digitSlideDown: {
          '0%': { opacity: 0, transform: 'translateY(100%)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
