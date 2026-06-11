import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        cream: '#f6f1e9',
        beige: '#e8ded1',
        ink: '#322f2b',
        muted: '#7a7167',
        terracotta: '#be7456',
        'terracotta-dark': '#a35d41',
        gold: '#d8aa50',
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      maxWidth: {
        content: '72rem',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(50,47,43,0.04), 0 8px 24px rgba(50,47,43,0.07)',
        lift: '0 2px 4px rgba(50,47,43,0.06), 0 16px 40px rgba(50,47,43,0.12)',
      },
    },
  },
  plugins: [typography],
};
