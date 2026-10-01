import { localeHtmlLang, pickLocalized, type Locale } from '@/lib/i18n';
import { SITE_URL, siteUrl } from '@/lib/seo';
import type { Product, StoreSettings } from '@/types';

type Schema = Record<string, unknown>;

const CURRENCY = 'AMD';

/** Organization from real storefront settings; optional blocks are omitted, never invented. */
export function organizationSchema(settings: StoreSettings | null, locale: Locale, siteName: string): Schema {
  const contact = settings?.contact;
  const social = settings?.social;
  const sameAs = [social?.instagram, social?.facebook, social?.youtube, social?.telegram].filter(Boolean);
  const address = pickLocalized(contact?.address, locale);

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteName,
    url: SITE_URL,
    ...(sameAs.length ? { sameAs } : {}),
    ...(contact
      ? {
          contactPoint: [
            {
              '@type': 'ContactPoint',
              contactType: 'customer service',
              telephone: contact.phone,
              ...(contact.email ? { email: contact.email } : {}),
              areaServed: 'AM',
              availableLanguage: ['hy', 'en', 'ru'],
            },
          ],
        }
      : {}),
    ...(address ? { address: { '@type': 'PostalAddress', streetAddress: address, addressCountry: 'AM' } } : {}),
  };
}

export function websiteSchema(locale: Locale, siteName: string): Schema {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: siteUrl(`/${locale}`),
    inLanguage: localeHtmlLang[locale],
  };
}

/**
 * Items are display breadcrumbs. Paths are locale-prefixed when known; the
 * last item may omit its path (schema.org allows a URL-less final crumb).
 */
export function breadcrumbSchema(items: { name: string; path?: string }[]): Schema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.path ? { item: siteUrl(item.path) } : {}),
    })),
  };
}

export function productSchema(product: Product, locale: Locale, path: string, siteName: string): Schema {
  const name = pickLocalized(product.name, locale);
  const description =
    pickLocalized(product.shortDescription, locale) || pickLocalized(product.description, locale);
  const images = [
    ...new Set([product.thumbnail, ...product.images.map((image) => image.url)].filter((url): url is string => Boolean(url))),
  ].map((url) => (url.startsWith('http') ? url : siteUrl(url)));
  const inStock = product.trackStock ? product.stock > 0 : true;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    ...(description ? { description } : {}),
    ...(images.length ? { image: images } : {}),
    ...(product.sku ? { sku: product.sku } : {}),
    brand: { '@type': 'Brand', name: siteName },
    offers: {
      '@type': 'Offer',
      url: siteUrl(path),
      price: product.price,
      priceCurrency: CURRENCY,
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
    ...(product.ratingCount > 0 && product.ratingAverage > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: Number(product.ratingAverage.toFixed(1)),
            reviewCount: product.ratingCount,
          },
        }
      : {}),
  };
}
