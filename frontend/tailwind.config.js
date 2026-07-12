/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#000000',
        card: '#111111',
        border: '#222222',
        accent: '#FFD700',
        'accent-hover': '#FFEB3B',
        muted: '#888888',
        text: '#FFFFFF',
        'text-secondary': '#CCCCCC',
        success: '#FFD700',
        warning: '#FFA000',
        danger: '#FF3B30',
        'tag-bg': '#1A1A1A',
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
