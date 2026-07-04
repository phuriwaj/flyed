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

// `output: 'static'` makes every page pre-render at build time. Routes that
// genuinely need a runtime (currently src/pages/api/*.ts) opt in via
// `export const prerender = false;` per-file. The Cloudflare adapter is
// retained so per-route SSR endpoints still deploy as Workers functions.

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
  output: 'static',
  adapter: cloudflare({
    // Image service mode: see `image:` block below for why `passthrough` is
    // the only choice that does anything (any other mode is silently
    // downgraded by @astrojs/cloudflare when src isn't ESM-imported).
    imageService: 'passthrough',
  }),
  env: {
    schema: {
      RESEND_API_KEY: { type: 'string', context: 'server', access: 'secret', optional: true },
      CRM_WEBHOOK_URL: { type: 'string', context: 'server', access: 'secret', optional: true },
      ENQUIRY_TO_EMAIL: { type: 'string', context: 'server', access: 'public', default: 'sales@flyed.dev' },
      PUBLIC_ANALYTICS_HOST: { type: 'string', context: 'client', access: 'public', optional: true },
    },
  },
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
  // NOTE: do NOT set `image.service: { entrypoint: 'astro/assets/services/sharp' }`
  // here. The Cloudflare adapter silently downgrades any non-adapter-managed
  // service to `passthrough` and prints a warning. Image-service config lives
  // on the adapter call (see above). When images eventually move from
  // `public/images/` to `src/assets/` and get ESM-imported, switching the
  // adapter's `imageService` from `'passthrough'` to `'compile'` is the
  // single change that unlocks build-time AVIF/WebP variants in
  // `dist/client/_astro/`.
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