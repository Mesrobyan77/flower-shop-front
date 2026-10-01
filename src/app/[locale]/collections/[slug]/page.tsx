import { notFound } from 'next/navigation';
import { serverGet } from '@/lib/api/client';
import { getDictionary, isLocale, localePath, pickLocalized, type Locale } from '@/lib/i18n';
import { buildPageMetadata } from '@/lib/seo';
import { breadcrumbSchema } from '@/lib/structured-data';
import { JsonLd } from '@/components/seo/JsonLd';
import { CatalogView } from '@/components/product/CatalogView';
import type { Collection } from '@/types';
import type { Metadata } from 'next';

export const revalidate = 300;

interface Params {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata(props: Params): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.locale)) notFound();
  const collection = await serverGet<Collection>(`/collections/${params.slug}`);
  if (!collection) return {};
  return buildPageMetadata({
    locale: params.locale,
    path: `/collections/${params.slug}`,
    title: pickLocalized(collection.title, params.locale),
    description: pickLocalized(collection.subtitle, params.locale) || undefined,
    images: collection.coverImage ? [collection.coverImage] : undefined,
  });
}

export default async function CollectionPage(props: Params) {
  const params = await props.params;
  if (!isLocale(params.locale)) notFound();
  const dict = getDictionary(params.locale);
  const collection = await serverGet<Collection>(`/collections/${params.slug}`);
  if (!collection) notFound();

  const name = pickLocalized(collection.title, params.locale);
  const selfPath = localePath(params.locale, `/collections/${collection.slug}`);
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
        collectionSlug={collection.slug}
        title={name}
        subtitle={pickLocalized(collection.subtitle, params.locale)}
        breadcrumb={crumbs}
      />
    </>
  );
}
