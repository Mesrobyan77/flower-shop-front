import { notFound } from 'next/navigation';
import { getDictionary, isLocale, localePath, type Locale } from '@/lib/i18n';
import { CatalogView } from '@/components/product/CatalogView';

export default async function NewArrivalsPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  if (!isLocale(params.locale)) notFound();
  const dict = getDictionary(params.locale);

  return (
    <CatalogView
      locale={params.locale}
      dict={dict}
      title={dict.home.newArrivals}
      breadcrumb={[
        { label: dict.product.breadcrumbHome, href: localePath(params.locale, '/') },
        { label: dict.home.newArrivals },
      ]}
    />
  );
}
