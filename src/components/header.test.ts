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
