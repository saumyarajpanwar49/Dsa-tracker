/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#080a0f', // Deep Ninja scroll navy black
        card: '#10141f', // Konoha armor deep gray-blue
        border: '#1f2538', // Metal/Kunai steel border
        accent: '#ff7a00', // Naruto Orange
        'accent-hover': '#ff9533', // Nine-Tails Chakra Light Orange
        muted: '#727d96', // Slate grey
        text: '#f0f3f8', // Soft white
        'text-secondary': '#adb8cc', // Soft blue-grey
        success: '#10b981', // Medical Ninjutsu Green
        warning: '#f59e0b', // Sage Mode Yellow
        danger: '#ef4444', // Uchiha Crimson Red
        'tag-bg': '#181e2f', // Hidden Leaf Headband blue-black
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
