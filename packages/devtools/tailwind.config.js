module.exports = {
  content: [
    './src/**/*.{ts,tsx,js,jsx}',
    '../../packages/ui/src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        tera: {
          black: '#05070F',
          carbon: '#0D1320',
          graphite: '#1D2940',
          blue: '#2F6DFF',
          cyan: '#32D7FF',
          purple: '#6F6DFF',
          mint: '#25D39F',
          amber: '#FFBE55',
          rose: '#FF6F91',
          mist: '#93A7CB',
          cloud: '#F2F7FF',
        },
        primary: '#2F6DFF',
        accent: '#32D7FF',
        highlight: '#6F6DFF',
        background: '#05070F',
        surface: '#0D1320',
        surfaceElevated: '#141D30',
        border: '#263552',
        text: '#F2F7FF',
        muted: '#93A7CB',
        success: '#25D39F',
        warning: '#FFBE55',
        danger: '#FF6F91',
      },
      fontFamily: {
        sans: ['Satoshi', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        heading: ['Space Grotesk', 'Inter', 'sans-serif'],
        code: ['JetBrains Mono', 'Fira Code', 'monospace'],
        satoshi: ['Satoshi', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
