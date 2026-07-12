/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0c120e', // Deep forest shinobi background
        card: '#142018', // Jounin Flak Jacket Green-Black
        border: '#25382b', // Kunai/Steel Olive green border
        accent: '#ff7a00', // Naruto Orange
        'accent-hover': '#ff9533', // Nine-Tails Light Orange
        muted: '#7a9282', // Sage/Leaf green-slate
        text: '#e8ece9', // Soft chalk white
        'text-secondary': '#a0b5a6', // Soft green-grey
        success: '#10b981', // Medical Ninjutsu Green
        warning: '#f59e0b', // Sage Mode Yellow
        danger: '#ef4444', // Uchiha Crimson Red
        'tag-bg': '#1d2f23', // Shinobi pouch forest green
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'chakra-glow': 'chakraGlow 2s infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        chakraGlow: {
          '0%': { boxShadow: '0 0 5px rgba(255, 122, 0, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(255, 122, 0, 0.6)' },
        }
      },
    },
  },
  plugins: [],
};
