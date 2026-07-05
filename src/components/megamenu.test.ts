import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('MegaMenu.astro', () => {
  const src = readFileSync(resolve(__dirname, './MegaMenu.astro'), 'utf8');

  it('renders all 6 categories', () => {
    for (const slug of [
      'service-learning',
      'cultural-heritage',
      'stem-environmental',
      'sports-adventure',
      'language-immersion',
      'history-heritage',
    ]) {
      expect(src).toContain(slug);
    }
  });

  it('renders all 12 destinations', () => {
    for (const dest of [
      'bangkok',
      'chiang-mai',
      'phuket',
      'krabi',
      'khao-sok',
      'kanchanaburi',
      'ayutthaya',
      'koh-tao',
      'sukhothai',
      'pai',
      'chiang-rai',
      'isan',
    ]) {
      expect(src).toContain(dest);
    }
  });

  it('uses two-pane layout', () => {
    expect(src).toMatch(/grid-cols-2|md:grid-cols-2/);
  });
});
