import { test, expect } from '@playwright/test';

test.describe('404 page', () => {
  // python's stdlib HTTP server returns its own bare 404 page for unknown
  // URLs — it doesn't fall back to dist/client/404.html the way Cloudflare
  // Pages does. We can still assert the status code, but the body checks
  // require either a real deploy or a Pages-emulating server.
  test('unknown URL shows 404 status', async ({ page }) => {
    const res = await page.goto('/this-page-does-not-exist-xyzzy');
    expect(res?.status()).toBe(404);
  });

  test.skip('404 page has heading and back-to-home link', async ({ page }) => {
    await page.goto('/this-page-does-not-exist-xyzzy');
    await expect(page.getByText('404').first()).toBeVisible();
    const homeLink = page.getByRole('link', { name: /home/i }).first();
    await expect(homeLink).toBeVisible();
  });

  test('Thai 404 also works', async ({ page }) => {
    const res = await page.goto('/th/this-page-does-not-exist-xyzzy');
    expect(res?.status()).toBe(404);
  });
});