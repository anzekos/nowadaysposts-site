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
        // Bilo #7a7167 = 3,97:1 na bezu. Pod WCAG AA (1.4.3) za navadno besedilo.
        muted: '#6b625a',
        // Bilo #be7456. Belo besedilo na njem je dalo 3,6:1, isti odtenek kot
        // besedilo na belem prav tako 3,6:1. Ta odtenek zdrzi 4,5:1 v obe
        // smeri in tudi na kremni ter bez podlagi.
        terracotta: '#9c5438',
        'terracotta-dark': '#7f4229',
        // Za akcentno besedilo NA temni podlagi (#322f2b). Tam temnejsi
        // odtenek pade na 2,4:1, zato rabimo svetlejsega.
        'terracotta-light': '#e0a184',
        gold: '#d8aa50',
      },
      fontFamily: {
        serif: ['Fraunces Variable', 'Fraunces', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
        sans: ['Inter Variable', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
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
