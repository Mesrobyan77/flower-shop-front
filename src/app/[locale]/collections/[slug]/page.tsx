import { notFound } from 'next/navigation';
import { serverGet } from '@/lib/api/client';
import { getDictionary, localePath, pickLocalized, type Locale } from '@/lib/i18n';
import { CatalogView } from '@/components/product/CatalogView';
import type { Collection } from '@/types';
import type { Metadata } from 'next';

export const revalidate = 300;

interface Params {
  params: { locale: Locale; slug: string };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const collection = await serverGet<Collection>(`/collections/${params.slug}`);
  if (!collection) return {};
  return {
    title: pickLocalized(collection.title, params.locale),
    description: pickLocalized(collection.subtitle, params.locale),
  };
}

export default async function CollectionPage({ params }: Params) {
  const dict = getDictionary(params.locale);
  const collection = await serverGet<Collection>(`/collections/${params.slug}`);
  if (!collection) notFound();

  return (
    <CatalogView
      locale={params.locale}
      dict={dict}
      collectionSlug={collection.slug}
      title={pickLocalized(collection.title, params.locale)}
      subtitle={pickLocalized(collection.subtitle, params.locale)}
      breadcrumb={[
        { label: dict.product.breadcrumbHome, href: localePath(params.locale, '/') },
        { label: pickLocalized(collection.title, params.locale) },
      ]}
    />
  );
}
