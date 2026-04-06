module.exports = {
  content: [
    './src/**/*.{ts,tsx,js,jsx}',
    '../../packages/ui/src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6366f1',
        accent: '#f472b6',
        background: '#0f172a',
        surface: '#1e293b',
        border: '#334155',
        text: '#f5f5f5',
      },
    },
  },
  plugins: [],
};
