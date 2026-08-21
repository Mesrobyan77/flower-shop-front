'use client';

import { useState } from 'react';
import { localePath, pickLocalized, type Dictionary, type Locale } from '@/lib/i18n';
import { ProductCarousel, ProductGrid } from '@/components/product/ProductCard';
import { HomeSectionHeader, PillTabs } from './HomeSections';
import type { Collection, Product } from '@/types';

/**
 * The reference groups several collections under one heading and switches
 * between them with pill tabs, keeping the product rail in place. The first tab
 * is a merged "all" view.
 */
export function CollectionTabs({
  title,
  collections,
  locale,
  dict,
  layout = 'carousel',
  centered,
  moreHref,
}: {
  title: string;
  collections: Collection[];
  locale: Locale;
  dict: Dictionary;
  layout?: 'carousel' | 'grid';
  centered?: boolean;
  moreHref?: string;
}) {
  const usable = collections.filter((collection) => (collection.products ?? []).length > 0);
  const [active, setActive] = useState('all');

  if (usable.length === 0) return null;

  const tabs = [
    { key: 'all', label: dict.home.allTab },
    ...usable.map((collection) => ({ key: collection.slug, label: pickLocalized(collection.title, locale) })),
  ];

  const dedupe = (items: Product[]) => {
    const seen = new Set<string>();
    return items.filter((item) => (seen.has(item.id) ? false : (seen.add(item.id), true)));
  };

  const products =
    active === 'all'
      ? dedupe(usable.flatMap((collection) => collection.products as Product[]))
      : ((usable.find((collection) => collection.slug === active)?.products ?? []) as Product[]);

  const activeCollection = usable.find((collection) => collection.slug === active);
  const href =
    moreHref ??
    (activeCollection ? localePath(locale, `/collections/${activeCollection.slug}`) : localePath(locale, '/new'));

  return (
    <section className="mx-auto w-full max-w-[1400px] px-4 py-10 lg:py-14">
      <HomeSectionHeader
        title={title}
        href={href}
        moreLabel={`${dict.common.seeAll} →`}
        centered={centered}
      />

      <PillTabs
        items={tabs}
        active={active}
        onChange={setActive}
        className={centered ? 'mb-8 justify-center' : 'mb-7'}
      />

      {layout === 'grid' ? (
        <ProductGrid products={products.slice(0, 8)} locale={locale} dict={dict} />
      ) : (
        <ProductCarousel products={products.slice(0, 12)} locale={locale} dict={dict} />
      )}
    </section>
  );
}
