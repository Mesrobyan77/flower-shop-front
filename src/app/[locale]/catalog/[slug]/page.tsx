import { notFound } from 'next/navigation';
import { serverGet } from '@/lib/api/client';
import { getDictionary, localePath, pickLocalized, type Locale } from '@/lib/i18n';
import { CatalogView } from '@/components/product/CatalogView';
import type { Category } from '@/types';
import type { Metadata } from 'next';

export const revalidate = 300;

interface Params {
  params: { locale: Locale; slug: string };
}

async function loadCategory(slug: string) {
  return serverGet<{ category: Category; children: Category[] }>(`/categories/${slug}`);
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const data = await loadCategory(params.slug);
  if (!data) return {};
  return {
    title: pickLocalized(data.category.name, params.locale),
    description: pickLocalized(data.category.description, params.locale),
  };
}

export default async function CategoryPage({ params }: Params) {
  const dict = getDictionary(params.locale);
  const data = await loadCategory(params.slug);
  if (!data) notFound();

  const { category, children } = data;

  return (
    <CatalogView
      locale={params.locale}
      dict={dict}
      category={category}
      subcategories={children}
      title={pickLocalized(category.name, params.locale)}
      subtitle={pickLocalized(category.description, params.locale)}
      breadcrumb={[
        { label: dict.product.breadcrumbHome, href: localePath(params.locale, '/') },
        { label: pickLocalized(category.name, params.locale) },
      ]}
    />
  );
}
