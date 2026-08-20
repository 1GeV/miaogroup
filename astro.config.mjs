import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://1gev.github.io',
  base: '/miaogroup',
  integrations: [sitemap()],
  markdown: { shikiConfig: { theme: 'github-light' } }
});
