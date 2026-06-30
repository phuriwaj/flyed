import { test, expect } from '@playwright/test';

test('home page loads with hero headline', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
