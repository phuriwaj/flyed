import { test, expect } from '@playwright/test';

test.describe('SEO basics', () => {
  test('home page has meta description', async ({ page }) => {
    await page.goto('/');
    const desc = await page.locator('meta[name="description"]').getAttribute('content');
    expect(desc).toBeTruthy();
    expect(desc!.length).toBeGreaterThan(50);
  });

  test('home page has OG image', async ({ page }) => {
    await page.goto('/');
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(ogImage).toBeTruthy();
  });

  test('home page has canonical', async ({ page }) => {
    await page.goto('/');
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toBe('https://flyed.dev/');
  });

  test('home page has Organization JSON-LD', async ({ page }) => {
    await page.goto('/');
    const ld = await page.locator('script[type="application/ld+json"]').first().textContent();
    expect(ld).toContain('"@type":"Organization"');
  });

  test('sitemap is generated', async ({ request }) => {
    const res = await request.get('/sitemap-index.xml');
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain('<sitemapindex');
  });

  test('TH route exists', async ({ page }) => {
    const res = await page.goto('/th');
    expect(res?.status()).toBe(200);
  });

  test('hreflang alternates present', async ({ page }) => {
    await page.goto('/');
    const en = await page.locator('link[rel="alternate"][hreflang="en"]').getAttribute('href');
    const th = await page.locator('link[rel="alternate"][hreflang="th"]').getAttribute('href');
    expect(en).toBeTruthy();
    expect(th).toBeTruthy();
  });
});
