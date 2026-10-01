import type { Metadata } from 'next';
import { localeHtmlLang, locales, type Locale } from '@/lib/i18n';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/+$/, '');

/** OpenGraph wants language_TERRITORY (hy_AM), unlike hreflang's hy-AM. */
const OG_LOCALES: Record<Locale, string> = { hy: 'hy_AM', en: 'en_US', ru: 'ru_RU' };

export function ogLocale(locale: Locale): string {
  return OG_LOCALES[locale];
}

export function siteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Localized canonical + HY/EN/RU alternates for a public path that has no locale segment. */
export function pageAlternates(locale: Locale, path: string): Metadata['alternates'] {
  const suffix = path === '/' ? '' : path;
  return {
    canonical: `/${locale}${suffix}`,
    languages: Object.fromEntries(locales.map((l) => [localeHtmlLang[l], `/${l}${suffix}`])),
  };
}

interface PageSeo {
  locale: Locale;
  path: string;
  title: string;
  /** Bypass the layout title template (used by the home page). */
  titleAbsolute?: boolean;
  description?: string;
  images?: string[];
  type?: 'website' | 'article';
}

/**
 * Public pages build their metadata here so canonical, hreflang and OpenGraph
 * stay in sync and point at the same localized URL the sitemap lists.
 */
export function buildPageMetadata({
  locale,
  path,
  title,
  titleAbsolute,
  description,
  images,
  type = 'website',
}: PageSeo): Metadata {
  const desc = description?.trim() ? description : undefined;
  const ogImages = (images ?? []).filter(Boolean);

  return {
    title: titleAbsolute ? { absolute: title } : title,
    // Omitted (not set to undefined) so the layout's default description survives the merge.
    ...(desc ? { description: desc } : {}),
    alternates: pageAlternates(locale, path),
    openGraph: {
      title,
      ...(desc ? { description: desc } : {}),
      type,
      locale: ogLocale(locale),
      ...(ogImages.length ? { images: ogImages.map((url) => ({ url })) } : {}),
    },
    twitter: {
      card: ogImages.length ? 'summary_large_image' : 'summary',
      title,
      ...(desc ? { description: desc } : {}),
      ...(ogImages.length ? { images: ogImages } : {}),
    },
  };
}
