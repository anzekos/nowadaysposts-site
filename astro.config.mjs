import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

// `site` se uporablja za canonical + sitemap (absolutni URL-ji).
// Bazne stile uvozi Layout prek src/styles/global.css (lastne plasti + motion tokeni).
export default defineConfig({
  site: 'https://nowadaysposts.pages.dev',
  integrations: [tailwind({ applyBaseStyles: false }), sitemap()],
});
