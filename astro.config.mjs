import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

// `site` se uporablja za canonical + sitemap (absolutni URL-ji).
export default defineConfig({
  site: 'https://nowadaysposts.pages.dev',
  integrations: [tailwind(), sitemap()],
});
