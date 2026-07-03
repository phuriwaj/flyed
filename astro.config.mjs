// @ts-check
import { defineConfig } from 'astro/config';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import prefetch from '@astrojs/prefetch';
import partytown from '@astrojs/partytown';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
// NOTE: output: 'server' is required for /api/* SSR endpoints. Every static
// page (e.g. src/pages/about.astro, src/pages/th/about.astro, src/pages/blog/[slug].astro)
// MUST declare `export const prerender = true;` in its frontmatter, otherwise
// it will be served by the SSR worker instead of being statically generated
// for upload to Cloudflare Pages. APIs under src/pages/api/* are the only
// routes that should be SSR.

// Cloudflare Pages directory-search 404: a request to /th/foo with no match
// searches upward for 404.html. Astro emits /th/404/index.html but not
// /th/404.html — copy the file so /th/* unknown paths show the TH 404.
const th404Copy = () => ({
  name: 'th-404-copy',
  hooks: {
    /**
     * @param {{ dir: URL }} hook
     */
    'astro:build:done': async ({ dir }) => {
      const src = fileURLToPath(new URL('./th/404/index.html', dir));
      const dst = fileURLToPath(new URL('./th/404.html', dir));
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dst);
        // eslint-disable-next-line no-console
        console.log(`[th-404-copy] copied ${dst}`);
      }
    },
  },
});

export default defineConfig({
  site: 'https://flyed.dev',
  output: 'server',
  adapter: cloudflare({}),
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'th'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  server: {
    host: '0.0.0.0',
  },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': '/src',
      },
    },
  },
  integrations: [
    mdx(),
    sitemap({ i18n: { defaultLocale: 'en', locales: { en: 'en', th: 'th' } } }),
    prefetch(),
    partytown({ config: { forward: ['dataLayer.push', 'plausible'] } }),
    react(),
    th404Copy(),
  ],
});