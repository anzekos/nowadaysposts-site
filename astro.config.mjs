import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// POMEMBNO: ob deployu zamenjaj `site` z dejansko Netlify domeno
// (npr. https://cozy-nest.netlify.app) — uporablja se za canonical + (kasneje) sitemap.
// Sitemap (@astrojs/sitemap) dodava ob deployu z verzijo, ki je združljiva.
export default defineConfig({
  site: 'https://nowadaysposts.netlify.app',
  integrations: [tailwind()],
});
