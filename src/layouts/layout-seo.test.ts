import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('BaseLayout SEO', () => {
  const src = readFileSync(resolve(__dirname, './Layout.astro'), 'utf8');

  it('uses astro-seo for meta tags', () => {
    expect(src).toMatch(/import\s+\{\s*SEO\s*\}\s+from\s+["']astro-seo["']/);
  });

  it('sets canonical URL', () => {
    expect(src).toMatch(/canonical/);
  });

  it('sets hreflang alternates', () => {
    expect(src).toMatch(/hreflang/);
  });

  it('includes Organization JSON-LD', () => {
    expect(src).toMatch(/application\/ld\+json/);
    expect(src).toMatch(/'@type':\s*'Organization'/);
  });
});
