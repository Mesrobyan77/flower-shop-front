import { hy, type Dictionary } from './dictionaries/hy';
import { en } from './dictionaries/en';
import { ru } from './dictionaries/ru';
import { defaultLocale, normalizeLocale, type Locale } from './config';

const DICTIONARIES: Record<Locale, Dictionary> = { hy, en, ru };

export function getDictionary(locale: string | undefined): Dictionary {
  return DICTIONARIES[normalizeLocale(locale)];
}

/** Prefixes an internal path with the active locale. */
export function localePath(locale: Locale, path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `/${locale}${clean === '/' ? '' : clean}`;
}

/** Swaps the locale segment of the current pathname, keeping the rest intact. */
export function switchLocalePath(pathname: string, next: Locale): string {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return `/${next}`;
  segments[0] = next;
  return `/${segments.join('/')}`;
}

/** Picks the best available string from a DB localized field. */
export function pickLocalized(
  value: { hy?: string; en?: string; ru?: string } | string | null | undefined,
  locale: Locale,
): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  const wanted = value[locale];
  if (wanted && wanted.trim()) return wanted;
  for (const l of ['hy', 'en', 'ru'] as const) {
    const candidate = value[l];
    if (candidate && candidate.trim()) return candidate;
  }
  return '';
}

export { defaultLocale, normalizeLocale };
export type { Dictionary, Locale };
export * from './config';
