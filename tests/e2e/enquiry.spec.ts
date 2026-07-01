import { test, expect } from '@playwright/test';

test.describe('Enquiry form', () => {
  test('wizard shows step 1 with school/email fields', async ({ page }) => {
    await page.goto('/enquire');
    await expect(page.getByLabel(/school/i).first()).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test('Next button is visible on step 1', async ({ page }) => {
    await page.goto('/enquire');
    await expect(page.getByRole('button', { name: /next/i }).first()).toBeVisible();
  });

  test('shows validation error if email empty on next', async ({ page }) => {
    await page.goto('/enquire');
    // Fill school/role/phone/country, leave email blank
    await page.getByLabel(/school/i).first().fill('Test School');
    await page.getByLabel(/role/i).first().fill('Teacher');
    await page.getByLabel(/phone/i).fill('+1234567890');
    await page.getByLabel(/country/i).fill('Thailand');
    await page.getByRole('button', { name: /next/i }).first().click();
    // Alert-red error span appears under email field
    await expect(page.locator('.text-alert-red').first()).toBeVisible({ timeout: 5000 });
  });

  test('rejects invalid email format', async ({ page }) => {
    await page.goto('/enquire');
    await page.getByLabel(/email/i).fill('not-an-email');
    await page.getByRole('button', { name: /next/i }).first().click();
    // At least one alert-red message should be visible
    await expect(page.locator('.text-alert-red').first()).toBeVisible({ timeout: 5000 });
  });

  test('contact page has a name/email/message form', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.getByLabel(/name/i).first()).toBeVisible();
    await expect(page.getByLabel(/email/i).first()).toBeVisible();
    await expect(page.getByLabel(/message/i)).toBeVisible();
  });
});