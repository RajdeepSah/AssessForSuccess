// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://a4stopeka.com',
  trailingSlash: 'always',
  integrations: [
    sitemap({
      filter: (page) => !page.endsWith('/thank-you/'),
    }),
  ],
  vite: {
    build: {
      // Keep scripts in external files so the Content-Security-Policy can stay strict (script-src 'self').
      assetsInlineLimit: 0,
    },
  },
});
