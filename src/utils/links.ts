import type { Locale } from '@/i18n';

export function localizedPath(locale: Locale, path: string): string {
  if (locale === 'th') {
    return `/th${path === '/' ? '' : path}`;
  }
  return path;
}

export const categoryPath = (slug: string, locale?: Locale) =>
  localizedPath(locale ?? 'en', `/trips/${slug}`);

export const destinationPath = (slug: string, locale?: Locale) =>
  localizedPath(locale ?? 'en', `/destinations/${slug}`);

export const itineraryPath = (slug: string, locale?: Locale) =>
  localizedPath(locale ?? 'en', `/itineraries/${slug}`);

export const blogPath = (slug: string, locale?: Locale) =>
  localizedPath(locale ?? 'en', `/blog/${slug}`);

export const enquirePath = (locale?: Locale) =>
  localizedPath(locale ?? 'en', '/enquire');
