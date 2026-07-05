import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for the flyed Astro site.
 *
 * `output: 'static'` + `@astrojs/cloudflare` means:
 *   - `astro preview` enters a redirect loop on /enquire (no Node entry
 *     for the Cloudflare adapter) and won't reliably serve the deployed
 *     shape.
 *   - `astro dev` fails with "Invalid hook call" inside workerd for pages
 *     that tree-shake in React components (e.g. /about renders
 *     <LanguageSwitcher/>).
 *
 * The CI workflow (see .github/workflows/ci.yml) sidesteps both by serving
 * the prerendered `dist/client/` directory with python's stdlib HTTP server.
 * We mirror that here so the same server shape is used in CI and locally:
 * Playwright boots the static server, runs the suite, and tears it down.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 60_000,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4321',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    // `npm run build` must have produced `dist/client/`. In CI the build
    // step precedes this; locally run `npm run build` once before the test
    // suite (or let Playwright time out if you forgot — the error is clear).
    command: 'python3 -m http.server 4321 --bind 127.0.0.1 --directory dist/client',
    url: 'http://127.0.0.1:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
