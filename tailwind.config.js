/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        ayamo: {
          primary: 'var(--ayamo-primary)',
          'primary-dark': 'var(--ayamo-primary-dark)',
          teal: 'var(--ayamo-teal)',
          accent: 'var(--ayamo-accent)',
          bg: 'var(--ayamo-bg)',
          surface: 'var(--ayamo-surface)',
          border: 'var(--ayamo-border)',
          text: 'var(--ayamo-text)',
          'text-mut': 'var(--ayamo-text-mut)',
          success: 'var(--ayamo-success)',
          warning: 'var(--ayamo-warning)',
          danger: 'var(--ayamo-danger)',
          'chart-1': 'var(--ayamo-chart-1)',
          'chart-2': 'var(--ayamo-chart-2)',
          'chart-3': 'var(--ayamo-chart-3)',
          'chart-4': 'var(--ayamo-chart-4)',
          'chart-5': 'var(--ayamo-chart-5)',
          'chart-6': 'var(--ayamo-chart-6)',
          'chart-7': 'var(--ayamo-chart-7)',
          'chart-8': 'var(--ayamo-chart-8)',
          'chart-grid': 'var(--ayamo-chart-grid)',
        },
      },
    },
  },
  plugins: [],
}
