import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Footer.astro', () => {
  const src = readFileSync(resolve(__dirname, './Footer.astro'), 'utf8');

  it('renders footer landmark', () => {
    expect(src).toMatch(/<footer/);
  });

  it('contains 4 column headings via dict', () => {
    expect(src).toMatch(/dict\.footer\.company/);
    expect(src).toMatch(/dict\.footer\.explore/);
    expect(src).toMatch(/dict\.footer\.legal/);
  });

  it('has copyright with dynamic year', () => {
    expect(src).toMatch(/©\s*\{year\}/);
    expect(src).toMatch(/flyed\.\s*\{dict\.footer\.rights\}/);
  });
});
