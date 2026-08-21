export const locales = ['hy', 'en', 'ru'] as const;
export type Locale = (typeof locales)[number];

/** Armenian is the default: an unknown or missing prefix resolves here. */
export const defaultLocale: Locale = 'hy';

export const localeNames: Record<Locale, string> = {
  hy: 'Հայերեն',
  en: 'English',
  ru: 'Русский',
};

export const localeShort: Record<Locale, string> = {
  hy: 'HY',
  en: 'EN',
  ru: 'RU',
};

export const localeHtmlLang: Record<Locale, string> = {
  hy: 'hy-AM',
  en: 'en',
  ru: 'ru',
};

export function isLocale(value: string | undefined): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

export function normalizeLocale(value: string | undefined): Locale {
  return isLocale(value) ? value : defaultLocale;
}
