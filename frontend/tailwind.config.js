/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#090a10',
        foreground: '#f8fafc',
        card: '#121420',
        'card-foreground': '#f8fafc',
        primary: {
          DEFAULT: '#8b5cf6', // Electric Purple
          foreground: '#ffffff',
          glow: '#a855f7',
        },
        secondary: {
          DEFAULT: '#06b6d4', // Cyber Cyan
          foreground: '#ffffff',
        },
        accent: {
          DEFAULT: '#f43f5e',
          foreground: '#ffffff',
        },
        muted: '#1e2235',
        'muted-foreground': '#94a3b8',
        border: '#2a2f4c',
      },
      boxShadow: {
        vr: '0 0 35px -5px rgba(139, 92, 246, 0.4)',
        cyan: '0 0 35px -5px rgba(6, 182, 212, 0.4)',
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        float: 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
      },
    },
  },
  plugins: [],
};
