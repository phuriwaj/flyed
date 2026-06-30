import { describe, it, expect } from 'vitest';
import { t, locales, isLocale } from './index';

describe('i18n', () => {
  it('exports en and th locales', () => {
    expect(locales).toEqual(['en', 'th']);
  });

  it('validates locale strings', () => {
    expect(isLocale('en')).toBe(true);
    expect(isLocale('th')).toBe(true);
    expect(isLocale('fr')).toBe(false);
  });

  it('returns translation for known key', () => {
    expect(t('en', 'nav.home')).toBe('Home');
    expect(t('th', 'nav.home')).toBe('หน้าแรก');
  });

  it('falls back to English for missing key', () => {
    expect(t('th', 'nonexistent.key' as any)).toBe('nonexistent.key');
  });
});
