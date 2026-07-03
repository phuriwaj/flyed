import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 60_000,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:4321',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: process.env.CI
    ? // In CI the GitHub Actions workflow already serves the prerendered
      // dist/client/ on 127.0.0.1:4321 (see .github/workflows/ci.yml).
      // Reuse that server instead of starting `npm run dev`, which has a
      // "Invalid hook call" failure inside workerd for pages containing
      // React components (e.g. /about renders <LanguageSwitcher/>).
      {
        command: 'echo "reusing existing server on 127.0.0.1:4321"',
        url: 'http://127.0.0.1:4321',
        reuseExistingServer: true,
        timeout: 10_000,
      }
    : // Locally, fall back to `npm run dev` for the dev workflow.
      {
        command: 'npm run dev',
        url: 'http://localhost:4321',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
