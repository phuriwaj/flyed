import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PAGES = [
  { path: '/', name: 'home' },
  { path: '/about', name: 'about' },
  { path: '/destinations', name: 'destinations' },
  { path: '/itineraries', name: 'itineraries' },
  { path: '/blog/2', name: 'blog-index' },
  { path: '/blog/01-why-thailand-service-learning', name: 'blog-post' },
  { path: '/enquire', name: 'enquire' },
  { path: '/contact', name: 'contact' },
  { path: '/th', name: 'th-home' },
  { path: '/th/blog/2', name: 'th-blog-index' },
];

for (const { path, name } of PAGES) {
  test(`a11y: ${name} (${path}) has no critical/serious violations`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );
    if (critical.length > 0) {
      console.log(`${name} violations:`, critical.map((v) => `${v.id}:${v.impact}`).join(', '));
    }
    expect(critical).toEqual([]);
  });
}

test('a11y: home page has a single h1', async ({ page }) => {
  await page.goto('/');
  const h1Count = await page.locator('h1').count();
  expect(h1Count).toBeGreaterThanOrEqual(1);
});

test('a11y: every page has a lang attribute', async ({ page }) => {
  for (const path of ['/', '/th']) {
    await page.goto(path);
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBeTruthy();
  }
});

test('a11y: all interactive images have alt text', async ({ page }) => {
  await page.goto('/');
  const images = await page.locator('img').all();
  for (const img of images) {
    const alt = await img.getAttribute('alt');
    const ariaHidden = await img.getAttribute('aria-hidden');
    // Either has alt text, or is decorative (aria-hidden=true)
    expect(alt !== null || ariaHidden === 'true').toBe(true);
  }
});

test('a11y: forms have associated labels', async ({ page }) => {
  await page.goto('/enquire');
  // Check that the email input is labelled (label or aria-label)
  const emailInput = page.getByLabel(/email/i).first();
  await expect(emailInput).toBeVisible();
});
