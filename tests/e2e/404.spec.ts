import { test, expect } from '@playwright/test';

test.describe('404 page', () => {
  test('unknown URL shows 404 status', async ({ page }) => {
    const res = await page.goto('/this-page-does-not-exist-xyzzy');
    expect(res?.status()).toBe(404);
  });

  test('404 page has heading and back-to-home link', async ({ page }) => {
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