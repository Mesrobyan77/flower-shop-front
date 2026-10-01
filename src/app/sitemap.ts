import type { MetadataRoute } from 'next';
import { serverGet, serverGetPaged } from '@/lib/api/client';
import { localeHtmlLang, locales } from '@/lib/i18n';
import { SITE_URL } from '@/lib/seo';
import type { Category, Collection, Post, Product } from '@/types';

export const revalidate = 3600;

/** Public static pages that exist once per locale. */
const STATIC_PATHS = [
  '/',
  '/new',
  '/magazine',
  '/subscription',
  '/delivery',
  '/about',
  '/events',
  '/awards',
  '/partner',
  '/support',
  '/support/faq',
  '/support/notice',
  '/privacy',
  '/terms',
];

const MAX_PAGES = 50;

/** One localized entry per locale with HY/EN/RU alternates, matching page canonicals. */
function localizedEntries(path: string, lastModified?: string): MetadataRoute.Sitemap {
  const suffix = path === '/' ? '' : path;
  const languages = Object.fromEntries(
    locales.map((locale) => [localeHtmlLang[locale], `${SITE_URL}/${locale}${suffix}`]),
  );

  return locales.map((locale) => ({
    url: `${SITE_URL}/${locale}${suffix}`,
    ...(lastModified ? { lastModified } : {}),
    alternates: { languages },
  }));
}

async function allProducts(): Promise<Product[]> {
  const products: Product[] = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const result = await serverGetPaged<Product>('/products', { page, limit: 60, sort: 'newest' });
    products.push(...result.items);
    if (!result.pagination.hasNext) break;
  }
  return products;
}

async function allMagazinePosts(): Promise<Post[]> {
  const posts: Post[] = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const result = await serverGetPaged<Post>('/posts', { type: 'magazine', page, limit: 60 });
    posts.push(...result.items);
    if (!result.pagination.hasNext) break;
  }
  return posts;
}

function flattenCategories(nodes: Category[]): Category[] {
  return nodes.flatMap((node) => [node, ...flattenCategories(node.children ?? [])]);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, magazines, categoryTree, collections] = await Promise.all([
    allProducts(),
    allMagazinePosts(),
    serverGet<Category[]>('/categories'),
    serverGet<Collection[]>('/collections'),
  ]);

  return [
    ...STATIC_PATHS.flatMap((path) => localizedEntries(path)),
    ...products.flatMap((product) => localizedEntries(`/product/${product.slug}`)),
    ...flattenCategories(categoryTree ?? []).flatMap((category) => localizedEntries(`/catalog/${category.slug}`)),
    ...(collections ?? []).flatMap((collection) => localizedEntries(`/collections/${collection.slug}`)),
    ...magazines.flatMap((post) => localizedEntries(`/magazine/${post.slug}`, post.publishedAt)),
  ];
}
