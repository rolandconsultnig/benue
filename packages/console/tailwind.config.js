/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // High-tech C2 Tactical Cyber Palette
        c2: {
          bg: '#070B12',
          card: 'rgba(15, 23, 42, 0.75)',
          surface: '#0F172A',
          border: 'rgba(51, 65, 85, 0.6)',
          accent: '#F97316',
          'accent-hover': '#EA580C',
          cyan: '#06B6D4',
          emerald: '#10B981',
          amber: '#F59E0B',
          red: '#EF4444',
        },
        brand: {
          bg: '#0B0F19',
          surface: '#111827',
          accent: '#F97316',
          'accent-dark': '#EA580C',
          'text-main': '#F8FAFC',
          'text-muted': '#94A3B8',
        },
        alert: {
          green: '#10B981',
          'green-bg': 'rgba(16, 185, 129, 0.15)',
          yellow: '#F59E0B',
          'yellow-bg': 'rgba(245, 158, 11, 0.15)',
          orange: '#F97316',
          'orange-bg': 'rgba(249, 115, 22, 0.15)',
          red: '#EF4444',
          'red-bg': 'rgba(239, 68, 68, 0.15)',
        },
        priority: {
          p1: '#EF4444',
          p2: '#F97316',
          p3: '#F59E0B',
          p4: '#64748B',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Consolas', 'Monaco', 'monospace'],
      },
      boxShadow: {
        'glass-sm': '0 2px 8px 0 rgba(0, 0, 0, 0.37), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
        'glass-md': '0 8px 32px 0 rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
        'glass-glow': '0 0 25px rgba(249, 115, 22, 0.25), inset 0 1px 0 0 rgba(255, 255, 255, 0.15)',
        'cyan-glow': '0 0 20px rgba(6, 182, 212, 0.3)',
        'red-glow': '0 0 25px rgba(239, 68, 68, 0.4)',
      },
    },
  },
  plugins: [],
};
