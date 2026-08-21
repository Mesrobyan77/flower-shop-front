import { getDictionary, localePath, type Locale } from '@/lib/i18n';
import { CatalogView } from '@/components/product/CatalogView';

export default function NewArrivalsPage({ params }: { params: { locale: Locale } }) {
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
