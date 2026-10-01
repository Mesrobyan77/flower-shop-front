import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

/**
 * Private application areas: bare and locale-prefixed forms both blocked.
 * /search is intentionally absent — it carries a noindex tag instead, since a
 * robots block would stop crawlers from ever reading that noindex.
 */
const PRIVATE_PATHS = [
  '/account',
  '/cart',
  '/checkout',
  '/login',
  '/register',
  '/order/',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', ...PRIVATE_PATHS, ...PRIVATE_PATHS.map((path) => `/*${path}`)],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
