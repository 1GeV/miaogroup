import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readFileSync } from 'node:fs';

const publishing = JSON.parse(readFileSync(new URL('./publishing.json', import.meta.url), 'utf8'));

export default defineConfig({
  site: publishing.site,
  base: process.env.PUBLISH_BASE ?? publishing.base,
  integrations: [sitemap()],
  vite: {
    server: {
      watch: {
        // Local diagnostics can contain browser files locked by another process.
        ignored: ['**/work/**']
      }
    }
  },
  markdown: { shikiConfig: { theme: 'github-light' } }
});
