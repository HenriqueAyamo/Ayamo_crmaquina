/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ayamo: {
          primary: 'var(--ayamo-primary)',
          accent: 'var(--ayamo-accent)',
          bg: 'var(--ayamo-bg)',
          surface: 'var(--ayamo-surface)',
          border: 'var(--ayamo-border)',
          text: 'var(--ayamo-text)',
          'text-mut': 'var(--ayamo-text-mut)',
          success: 'var(--ayamo-success)',
          warning: 'var(--ayamo-warning)',
          danger: 'var(--ayamo-danger)',
        },
      },
    },
  },
  plugins: [],
}
