import { test, expect } from '@playwright/test';

test.describe('i18n navigation', () => {
  test('home page in English loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/$/);
  });

  test('home page in Thai loads at /th', async ({ page }) => {
    await page.goto('/th');
    await expect(page).toHaveURL(/\/th\/?$/);
  });

  test('switching to Thai locale prefix persists across navigation', async ({ page }) => {
    await page.goto('/th');
    await page.goto('/th/about');
    // python http.server normalizes /th/about -> /th/about/, hence the
    // optional trailing slash.
    await expect(page).toHaveURL(/\/th\/about\/?$/);
  });

  test('Thai home page has Thai lang attribute or content', async ({ page }) => {
    await page.goto('/th');
    const html = await page.content();
    // Thai content somewhere in the page
    const hasThai = /[฀-๿]/.test(html);
    expect(hasThai).toBe(true);
  });

  test('Thai itineraries page exists', async ({ page }) => {
    const res = await page.goto('/th/itineraries');
    expect(res?.ok()).toBe(true);
  });

  test('Thai blog page exists', async ({ page }) => {
    const res = await page.goto('/th/blog');
    expect(res?.ok()).toBe(true);
  });
});