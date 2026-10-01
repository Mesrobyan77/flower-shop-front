import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getDictionary, isLocale, localePath, type Locale } from '@/lib/i18n';
import { buildPageMetadata } from '@/lib/seo';
import { breadcrumbSchema } from '@/lib/structured-data';
import { JsonLd } from '@/components/seo/JsonLd';
import { CatalogView } from '@/components/product/CatalogView';

/**
 * CatalogView reads filters via useSearchParams, so a static prerender would
 * client-side-bail and serve only the loading fallback - no h1 or content in
 * the HTML. Render this sitemap-listed page per request like catalog/[slug].
 */
export const dynamic = 'force-dynamic';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.locale)) return {};
  const dict = getDictionary(params.locale);
  return buildPageMetadata({
    locale: params.locale,
    path: '/new',
    title: dict.home.newArrivals,
  });
}

export default async function NewArrivalsPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  if (!isLocale(params.locale)) notFound();
  const dict = getDictionary(params.locale);
  const selfPath = localePath(params.locale, '/new');
  const crumbs: { label: string; href?: string }[] = [
    { label: dict.product.breadcrumbHome, href: localePath(params.locale, '/') },
    { label: dict.home.newArrivals },
  ];

  return (
    <>
      <JsonLd data={breadcrumbSchema(crumbs.map((crumb) => ({ name: crumb.label, path: crumb.href ?? selfPath })))} />
      <CatalogView
        locale={params.locale}
        dict={dict}
        title={dict.home.newArrivals}
        breadcrumb={crumbs}
      />
    </>
  );
}
