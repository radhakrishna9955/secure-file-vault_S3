module.exports = {
  content: ['./pages/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        vault: {
          primary: '#6366f1',
          dark: '#1e1b4b',
          glass: 'rgba(255,255,255,0.05)',
        },
      },
      backdropBlur: { xs: '2px' },
    },
  },
  plugins: [],
};