import typography from '@tailwindcss/typography';

/*
  Tokeni iz DESIGN-LOCK.md (2026-10-27). Paleta je "terakota + skrilavec": hladna nevtralna
  podlaga, da tople Flow scene izstopijo, in ena akcentna barva. Kontrasti (WCAG):
  muted na canvas 5,8:1, terakota na canvas 5,2:1, bela na terakoti 5,5:1.
*/
const canvas = '#f5f6f7';
const line = '#e2e5e9';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        canvas,
        surface: '#fdfdfd',
        line,
        ink: '#1d232b',
        muted: '#556170',
        terracotta: '#9c5438',
        'terracotta-dark': '#7f4229',
        'terracotta-soft': '#f4e9e3',
        // Stari imeni (pred prenovo) kot alias, da strani, ki jih prenova ne prepiše, ostanejo skladne.
        cream: canvas,
        beige: line,
      },
      fontFamily: {
        serif: ['Playfair Display Variable', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans Variable', 'Plus Jakarta Sans', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      maxWidth: {
        content: '76rem',
      },
      boxShadow: {
        lift: '0 10px 30px rgb(29 35 43 / 0.10)',
        bar: '0 -6px 24px rgb(29 35 43 / 0.08)',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.23, 1, 0.32, 1)',
      },
      transitionDuration: {
        press: '140ms',
        ui: '200ms',
        overlay: '260ms',
      },
    },
  },
  plugins: [typography],
};
