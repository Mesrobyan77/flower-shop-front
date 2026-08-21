import { getDictionary, localePath, type Locale } from '@/lib/i18n';
import { CatalogView } from '@/components/product/CatalogView';

export default function SearchPage({
  params,
  searchParams,
}: {
  params: { locale: Locale };
  searchParams: { q?: string };
}) {
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
