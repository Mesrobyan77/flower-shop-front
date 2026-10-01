import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getDictionary, isLocale, localePath, type Locale } from '@/lib/i18n';
import { CatalogView } from '@/components/product/CatalogView';

/** Internal search results must never be indexed; links inside them stay followable. */
export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.locale)) return {};
  const dict = getDictionary(params.locale);
  return {
    title: dict.common.search,
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage(
  props: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ q?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  if (!isLocale(params.locale)) notFound();
  const dict = getDictionary(params.locale);
  const term = searchParams.q ?? '';

  return (
    <CatalogView
      locale={params.locale}
      dict={dict}
      fixedQuery={term}
      title={term ? `"${term}"` : dict.common.search}
      subtitle={term ? undefined : dict.catalog.noResultsHint}
      breadcrumb={[
        { label: dict.product.breadcrumbHome, href: localePath(params.locale, '/') },
        { label: dict.common.search },
      ]}
    />
  );
}
