import { notFound } from 'next/navigation';
import { serverGet } from '@/lib/api/client';
import { getDictionary, isLocale, localePath, pickLocalized, type Locale } from '@/lib/i18n';
import { buildPageMetadata } from '@/lib/seo';
import { breadcrumbSchema } from '@/lib/structured-data';
import { JsonLd } from '@/components/seo/JsonLd';
import { CatalogView } from '@/components/product/CatalogView';
import type { Category } from '@/types';
import type { Metadata } from 'next';

export const revalidate = 300;

interface Params {
  params: Promise<{ locale: string; slug: string }>;
}

async function loadCategory(slug: string) {
  return serverGet<{ category: Category; children: Category[] }>(`/categories/${slug}`);
}

export async function generateMetadata(props: Params): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.locale)) notFound();
  const data = await loadCategory(params.slug);
  if (!data) return {};
  return buildPageMetadata({
    locale: params.locale,
    path: `/catalog/${params.slug}`,
    title: pickLocalized(data.category.name, params.locale),
    description: pickLocalized(data.category.description, params.locale) || undefined,
    images: data.category.image ? [data.category.image] : undefined,
  });
}

export default async function CategoryPage(props: Params) {
  const params = await props.params;
  if (!isLocale(params.locale)) notFound();
  const dict = getDictionary(params.locale);
  const data = await loadCategory(params.slug);
  if (!data) notFound();

  const { category, children } = data;
  const name = pickLocalized(category.name, params.locale);
  const selfPath = localePath(params.locale, `/catalog/${category.slug}`);
  const crumbs: { label: string; href?: string }[] = [
    { label: dict.product.breadcrumbHome, href: localePath(params.locale, '/') },
    { label: name },
  ];

  return (
    <>
      <JsonLd data={breadcrumbSchema(crumbs.map((crumb) => ({ name: crumb.label, path: crumb.href ?? selfPath })))} />
      <CatalogView
        locale={params.locale}
        dict={dict}
        category={category}
        subcategories={children}
        title={name}
        subtitle={pickLocalized(category.description, params.locale)}
        breadcrumb={crumbs}
      />
    </>
  );
}
