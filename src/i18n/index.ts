import en from './en.json';
import th from './th.json';

export const locales = ['en', 'th'] as const;
export type Locale = (typeof locales)[number];

const dictionaries: Record<Locale, Record<string, any>> = { en, th };

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function t(locale: Locale, key: string): string {
  const dict = dictionaries[locale] ?? dictionaries.en;
  const parts = key.split('.');
  let cur: any = dict;
  for (const p of parts) {
    if (cur == null) return key;
    cur = cur[p];
  }
  return typeof cur === 'string' ? cur : key;
}

export function getDict(locale: Locale) {
  return dictionaries[locale] ?? dictionaries.en;
}
