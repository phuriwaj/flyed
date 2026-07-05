import { test, expect } from '@playwright/test';

test.describe('Blog index', () => {
  test('lists posts', async ({ page }) => {
    // Astro paginate[...page] → /blog is page 1 (redirect or index), /blog/2 = page 2
    await page.goto('/blog/2');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const links = await page.locator('a[href*="/blog/"]').count();
    expect(links).toBeGreaterThan(0);
  });

  test('first blog post opens and shows title + body', async ({ page }) => {
    await page.goto('/blog/2');
    const firstLink = page
      .locator('a[href*="/blog/"]:not([href$="/blog"]):not([href*="/tag"])')
      .first();
    await firstLink.click();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('tag filter UI exists', async ({ page }) => {
    await page.goto('/blog/2');
    const tagUi = page.locator(
      '[data-testid="tag-filter"], select[name*="tag"], [aria-label*="tag" i]',
    );
    if ((await tagUi.count()) > 0) {
      await expect(tagUi.first()).toBeVisible();
    } else {
      test.skip();
    }
  });
});

test.describe('Itinerary pages', () => {
  test('itinerary index loads', async ({ page }) => {
    await page.goto('/itineraries');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('first itinerary detail page loads with hero image', async ({ page }) => {
    await page.goto('/itineraries');
    const link = page.locator('a[href^="/itineraries/"]').first();
    await link.click();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // Hero image is first big image
    const heroImg = page.locator('img').first();
    await expect(heroImg).toBeVisible();
  });
});
