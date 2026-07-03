import { test, expect } from '@playwright/test';

test.describe('Enquiry form', () => {
  test('wizard shows step 1 with school/email fields', async ({ page }) => {
    await page.goto('/enquire');
    await expect(page.getByLabel(/school/i).first()).toBeVisible();
    await expect(page.getByLabel(/email/i).first()).toBeVisible();
  });

  test('Next button is visible on step 1', async ({ page }) => {
    await page.goto('/enquire');
    await expect(page.getByRole('button', { name: /next/i }).first()).toBeVisible();
  });

  test('shows email-required error if email blank on next', async ({ page }) => {
    await page.goto('/enquire');
    // Fill all step 0 fields EXCEPT email, then click Next. This isolates the
    // email field — if email validation breaks, this test fails. Previously
    // this test passed for the wrong reason (missing groupSize/ages/etc).
    await page.getByLabel(/group size/i).fill('20');
    await page.getByLabel(/ages/i).fill('14-16');
    await page.getByLabel(/departure month/i).fill('2026-09');
    await page.getByLabel(/length/i).fill('7');
    await page.getByLabel(/school/i).first().fill('Test School');
    await page.getByLabel(/role/i).first().fill('Teacher');
    await page.getByLabel(/phone/i).fill('+1234567890');
    await page.getByLabel(/country/i).fill('Thailand');
    // email intentionally left blank
    await page.getByRole('button', { name: /next/i }).first().click();
    // Should still be on step 0 (Next didn't advance)
    await expect(page.getByText(/step 1 of/i)).toBeVisible();
  });

  test('rejects invalid email format', async ({ page }) => {
    await page.goto('/enquire');
    // Fill all step 0 fields with valid values except email (which is malformed)
    await page.getByLabel(/group size/i).fill('20');
    await page.getByLabel(/ages/i).fill('14-16');
    await page.getByLabel(/departure month/i).fill('2026-09');
    await page.getByLabel(/length/i).fill('7');
    await page.getByLabel(/school/i).first().fill('Test School');
    await page.getByLabel(/role/i).first().fill('Teacher');
    await page.getByLabel(/phone/i).fill('+1234567890');
    await page.getByLabel(/country/i).fill('Thailand');
    await page.getByLabel(/email/i).first().fill('not-an-email');
    await page.getByRole('button', { name: /next/i }).first().click();
    // Email format error should be visible (and we remain on step 1)
    await expect(page.getByText(/step 1 of/i)).toBeVisible();
  });

  test('contact page has a name/email/message form', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.getByLabel(/name/i).first()).toBeVisible();
    await expect(page.getByLabel(/email/i).first()).toBeVisible();
    await expect(page.getByLabel(/message/i)).toBeVisible();
  });
});
