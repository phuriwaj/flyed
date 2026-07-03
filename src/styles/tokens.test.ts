import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('design tokens', () => {
  const css = readFileSync(resolve(__dirname, './global.css'), 'utf8');

  // Apple palette — surfaces
  it('defines --color-canvas', () => {
    expect(css).toMatch(/--color-canvas:\s*#ffffff/i);
  });

  it('defines --color-canvas-parchment', () => {
    expect(css).toMatch(/--color-canvas-parchment:\s*#f5f5f7/i);
  });

  it('defines --color-surface-tile-1', () => {
    expect(css).toMatch(/--color-surface-tile-1:\s*#272729/i);
  });

  it('defines --color-ink', () => {
    expect(css).toMatch(/--color-ink:\s*#1d1d1f/i);
  });

  // Brand accent
  it('defines --color-primary Action Blue', () => {
    expect(css).toMatch(/--color-primary:\s*#0066cc/i);
  });

  it('defines --color-primary-on-dark', () => {
    expect(css).toMatch(/--color-primary-on-dark:\s*#2997ff/i);
  });

  it('defines --color-primary-focus', () => {
    expect(css).toMatch(/--color-primary-focus:\s*#0071e3/i);
  });

  it('defines --color-primary-hover', () => {
    expect(css).toMatch(/--color-primary-hover:\s*#0077ed/i);
  });

  it('defines --color-primary-pressed', () => {
    expect(css).toMatch(/--color-primary-pressed:\s*#0058a6/i);
  });

  // Ink scale
  it('defines --color-ink-muted-80', () => {
    expect(css).toMatch(/--color-ink-muted-80:\s*#333333/i);
  });

  it('defines --color-ink-muted-60', () => {
    expect(css).toMatch(/--color-ink-muted-60:\s*#6e6e73/i);
  });

  // Surfaces
  it('defines --color-surface-pearl', () => {
    expect(css).toMatch(/--color-surface-pearl:\s*#fafafc/i);
  });

  it('defines --color-surface-tile-2', () => {
    expect(css).toMatch(/--color-surface-tile-2:\s*#2a2a2c/i);
  });

  it('defines --color-surface-tile-3', () => {
    expect(css).toMatch(/--color-surface-tile-3:\s*#252527/i);
  });

  // Hairlines
  it('defines --color-hairline', () => {
    expect(css).toMatch(/--color-hairline:\s*#e0e0e0/i);
  });

  it('defines --color-divider-soft', () => {
    expect(css).toMatch(/--color-divider-soft:\s*#f0f0f0/i);
  });

  it('defines --color-divider-strong', () => {
    expect(css).toMatch(/--color-divider-strong:\s*#b8b8bd/i);
  });

  // Type scale
  it('defines --text-body 17px', () => {
    expect(css).toMatch(/--text-body:\s*17px/);
  });

  it('defines --text-hero-display', () => {
    expect(css).toMatch(/--text-hero-display:\s*56px/);
  });

  it('defines --text-display-lg', () => {
    expect(css).toMatch(/--text-display-lg:\s*40px/);
  });

  it('defines --text-display-md', () => {
    expect(css).toMatch(/--text-display-md:\s*34px/);
  });

  it('defines --text-lead 28px', () => {
    expect(css).toMatch(/--text-lead:\s*28px/);
  });

  it('defines --text-tagline 21px', () => {
    expect(css).toMatch(/--text-tagline:\s*21px/);
  });

  it('defines --text-caption 14px', () => {
    expect(css).toMatch(/--text-caption:\s*14px/);
  });

  // Radius scale (categorical)
  it('defines --radius-none', () => {
    expect(css).toMatch(/--radius-none:\s*0px/);
  });

  it('defines --radius-xs 5px', () => {
    expect(css).toMatch(/--radius-xs:\s*5px/);
  });

  it('defines --radius-sm 8px', () => {
    expect(css).toMatch(/--radius-sm:\s*8px/);
  });

  it('defines --radius-md 11px', () => {
    expect(css).toMatch(/--radius-md:\s*11px/);
  });

  it('defines --radius-lg 18px', () => {
    expect(css).toMatch(/--radius-lg:\s*18px/);
  });

  it('defines --radius-pill', () => {
    expect(css).toMatch(/--radius-pill:\s*9999px/);
  });

  // Spacing scale
  it('defines --spacing-tile-y 80px', () => {
    expect(css).toMatch(/--spacing-tile-y:\s*80px/);
  });

  it('defines --spacing-tile-y-mobile 48px', () => {
    expect(css).toMatch(/--spacing-tile-y-mobile:\s*48px/);
  });

  it('defines --spacing-section-y 96px', () => {
    expect(css).toMatch(/--spacing-section-y:\s*96px/);
  });

  // Container widths
  it('defines --container-home 80rem', () => {
    expect(css).toMatch(/--container-home:\s*80rem/);
  });

  it('defines --container-content 72rem', () => {
    expect(css).toMatch(/--container-content:\s*72rem/);
  });

  // Single shadow reserved for photography
  it('defines --shadow-photography with rgba(0,0,0,0.22)', () => {
    expect(css).toMatch(/--shadow-photography:.*rgba\(0,\s*0,\s*0,\s*0\.22\)/i);
  });

  it('does not define --shadow-product (renamed to --shadow-photography)', () => {
    expect(css).not.toMatch(/--shadow-product:/);
  });

  // Apple type family
  it('uses SF Pro Display stack for --font-display', () => {
    expect(css).toMatch(/--font-display:.*SF Pro Display/);
  });

  it('uses SF Pro Text stack for --font-body', () => {
    expect(css).toMatch(/--font-body:.*SF Pro Text/);
  });

  // No warm palette leakage
  it('does not define legacy teak tokens', () => {
    expect(css).not.toMatch(/--color-teak-/);
  });

  it('does not define legacy bamboo tokens', () => {
    expect(css).not.toMatch(/--color-bamboo-/);
  });

  it('does not define legacy sunset tokens', () => {
    expect(css).not.toMatch(/--color-sunset-/);
  });

  it('does not define legacy rice tokens', () => {
    expect(css).not.toMatch(/--color-rice-/);
  });

  // Fraunces dropped
  it('does not define Fraunces font', () => {
    expect(css).not.toMatch(/Fraunces/);
  });
});