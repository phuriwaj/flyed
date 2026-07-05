import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'tests/unit/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      reporter: ['text', 'html'],
      exclude: ['**/*.test.*', '**/node_modules/**', '**/dist/**', '**/.astro/**'],
    },
  },
  resolve: {
    alias: [
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
      { find: /^astro:content$/, replacement: fileURLToPath(new URL('./tests/mocks/astro-content.ts', import.meta.url)) },
      { find: /^astro:env\/server$/, replacement: fileURLToPath(new URL('./tests/mocks/astro-env.ts', import.meta.url)) },
      { find: /^astro:env\/client$/, replacement: fileURLToPath(new URL('./tests/mocks/astro-env.ts', import.meta.url)) },
      { find: /^astro:env$/, replacement: fileURLToPath(new URL('./tests/mocks/astro-env.ts', import.meta.url)) },
      { find: /^virtual:astro:env\/schema$/, replacement: fileURLToPath(new URL('./tests/mocks/virtual-astro-env-schema.ts', import.meta.url)) },
    ],
  },
});
