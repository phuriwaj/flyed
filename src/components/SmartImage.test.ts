import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('SmartImage.astro', () => {
  const src = readFileSync(resolve(__dirname, './SmartImage.astro'), 'utf8');

  it('documented preferred wrapper (explanatory comment)', () => {
    expect(src).toMatch(/Why not <Image> from astro:assets/);
  });

  it('exports Props with alt required and width/height optional', () => {
    expect(src).toMatch(/alt:\s*string/);
    expect(src).toMatch(/width\?:\s*number/);
    expect(src).toMatch(/height\?:\s*number/);
  });

  it('defaults loading to lazy', () => {
    expect(src).toMatch(/loading\s*=\s*'lazy'/);
  });

  it('always sets decoding=async', () => {
    expect(src).toMatch(/decoding="async"/);
  });

  it('builds responsive srcset at common widths', () => {
    expect(src).toMatch(/\[400,\s*800,\s*1200,\s*1600\]/);
    expect(src).toMatch(/srcset/);
  });

  it('rewrites Unsplash URLs via w= param', () => {
    expect(src).toMatch(/w=\$\{variantWidth\}/);
  });
});