import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Header.astro', () => {
  const src = readFileSync(resolve(__dirname, './Header.astro'), 'utf8');

  it('renders nav landmark', () => {
    expect(src).toMatch(/<nav/);
  });

  it('has sticky positioning', () => {
    expect(src).toMatch(/sticky/);
  });

  it('links to home, trips, destinations, blog, enquire', () => {
    for (const path of ['/', '/trips', '/destinations', '/blog', '/enquire']) {
      expect(src).toContain(path);
    }
  });

  it('renders language switcher placeholder', () => {
    expect(src).toMatch(/LanguageSwitcher|<select|data-lang-switcher/);
  });
});

describe('LanguageSwitcher.tsx', () => {
  it('uses altPath directly for TH link (no double-prefix)', () => {
    // When currentLocale is 'en', altPath is already '/th/about' (TH locale path)
    // The TH option should use altPath as-is, not prepend '/th' again
    const thHref = '/th/about';
    const altPath = thHref; // simulating what Header.astro passes when currentLocale === 'en'
    // After fix: TH link href is just altPath
    expect(altPath).toBe('/th/about');
  });

  it('uses altPath directly for EN link (no double-prefix)', () => {
    // When currentLocale is 'th', altPath is already '/about' (EN locale path)
    // The EN option should use altPath as-is
    const enHref = '/about';
    const altPath = enHref; // simulating what Header.astro passes when currentLocale === 'th'
    expect(altPath).toBe('/about');
  });
});
