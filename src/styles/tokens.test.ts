import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('design tokens', () => {
  const css = readFileSync(resolve(__dirname, './global.css'), 'utf8');

  it('defines --color-teak-900', () => {
    expect(css).toMatch(/--color-teak-900:\s*#1F1410/i);
  });

  it('defines --color-bamboo-700', () => {
    expect(css).toMatch(/--color-bamboo-700:\s*#2D4A2B/i);
  });

  it('defines --color-sunset-600', () => {
    expect(css).toMatch(/--color-sunset-600:\s*#D96B3D/i);
  });

  it('defines --color-rice-50', () => {
    expect(css).toMatch(/--color-rice-50:\s*#FAF6EE/i);
  });
});
