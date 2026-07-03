import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

const PAGES = [
  { path: '/', name: 'home' },
  { path: '/about', name: 'about' },
  { path: '/destinations', name: 'destinations' },
  { path: '/itineraries', name: 'itineraries' },
  { path: '/enquire', name: 'enquire' },
  { path: '/contact', name: 'contact' },
];

for (const vp of VIEWPORTS) {
  for (const p of PAGES) {
    test(`visual: ${p.name} @ ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(p.path, { waitUntil: 'networkidle' });
      // Disable animations site-wide via injected CSS
      await page.addStyleTag({
        content: `*, *::before, *::after {
          animation-duration: 0s !important;
          transition-duration: 0s !important;
          animation-delay: 0s !important;
          transition-delay: 0s !important;
        }`,
      });
      // Scroll to bottom and back to trigger any lazy-load
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(300);
      await expect(page).toHaveScreenshot(`${p.name}-${vp.name}.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.02,
        timeout: 60000,
        animations: 'disabled',
      });
    });
  }
}

test('visual: home page hero section (above the fold)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.addStyleTag({
    content: `*, *::before, *::after {
      animation-duration: 0s !important;
      transition-duration: 0s !important;
    }`,
  });
  await expect(page).toHaveScreenshot('home-hero-fold.png', {
    fullPage: false,
    maxDiffPixelRatio: 0.01,
    animations: 'disabled',
  });
});
