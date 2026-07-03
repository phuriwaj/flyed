import { test, expect } from '@playwright/test';
import { parse as parseYaml } from 'yaml';

test.describe('Decap CMS admin shell', () => {
  test('/admin loads with Decap script tag', async ({ page }) => {
    await page.goto('/admin');
    const decapScript = page.locator('script[src*="decap-cms"]');
    await expect(decapScript).toHaveCount(1);
  });

  test('/admin has noindex meta tag', async ({ page }) => {
    await page.goto('/admin');
    const robots = page.locator('meta[name="robots"]');
    await expect(robots).toHaveAttribute('content', /noindex/i);
  });

  test('/admin/config.yml returns 200 and parses as valid YAML', async ({ request }) => {
    const response = await request.get('/admin/config.yml');
    expect(response.status()).toBe(200);
    const text = await response.text();
    const parsed = parseYaml(text);
    expect(parsed.collections).toBeDefined();
    expect(parsed.collections.length).toBe(3);
    const collectionNames = parsed.collections.map((c: { name: string }) => c.name);
    expect(collectionNames).toContain('blog');
    expect(collectionNames).toContain('blog-th');
    expect(collectionNames).toContain('team');
  });

  test('/admin/config.yml has editorial workflow enabled', async ({ request }) => {
    const response = await request.get('/admin/config.yml');
    const parsed = parseYaml(await response.text());
    expect(parsed.publish_mode).toBe('editorial_workflow');
  });

  test('/admin/preview.html renders iframe with branch-aware URL', async ({ page }) => {
    await page.goto('/admin/preview.html?slug=test-post&branch=main&locale=en');
    const frame = page.locator('iframe');
    await expect(frame).toHaveAttribute('src', 'https://flyed.dev/blog/test-post');
    const banner = page.locator('.preview-banner');
    await expect(banner).toContainText('main');
  });

  test('/admin/preview.html handles non-main branch with CF Pages URL', async ({ page }) => {
    await page.goto('/admin/preview.html?slug=test-post&branch=cms%2Ftest-post&locale=en');
    const frame = page.locator('iframe');
    await expect(frame).toHaveAttribute(
      'src',
      'https://cms--test-post--flyed-dev.pages.dev/blog/test-post',
    );
  });

  test('/admin/* SPA fallback works for unknown paths', async ({ page }) => {
    await page.goto('/admin/some/deep/path');
    // Should load index.html with Decap script
    const decapScript = page.locator('script[src*="decap-cms"]');
    await expect(decapScript).toHaveCount(1);
  });
});
