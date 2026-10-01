'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useMemo, useState } from 'react';
import { cn, formatNumber } from '@/lib/utils';
import { localePath, pickLocalized, type Dictionary, type Locale } from '@/lib/i18n';
import { useProducts } from '@/lib/hooks/useCatalog';
import { ProductGrid } from '@/components/product/ProductCard';
import { EmptyState, Pagination, ProductGridSkeleton } from '@/components/ui/Feedback';
import { Breadcrumb } from '@/components/ui/Display';
import { FilterIcon } from '@/components/ui/Icons';
import { Drawer } from '@/components/ui/Overlay';
import type { Category, SortOption } from '@/types';

interface CatalogViewProps {
  locale: Locale;
  dict: Dictionary;
  category?: Category;
  subcategories?: Category[];
  collectionSlug?: string;
  title: string;
  subtitle?: string;
  breadcrumb: { label: string; href?: string }[];
  fixedQuery?: string;
}

const SORTS: { key: SortOption; label: keyof Dictionary['catalog'] }[] = [
  { key: 'recommended', label: 'sortRecommended' },
  { key: 'newest', label: 'sortNewest' },
  { key: 'popular', label: 'sortPopular' },
  { key: 'review', label: 'sortReview' },
  { key: 'price_asc', label: 'sortPriceAsc' },
  { key: 'price_desc', label: 'sortPriceDesc' },
];

const PRICE_BANDS = [
  { key: '0-15000', min: 0, max: 15000 },
  { key: '15000-30000', min: 15000, max: 30000 },
  { key: '30000-50000', min: 30000, max: 50000 },
  { key: '50000-', min: 50000, max: undefined },
];

/**
 * Listing shell for category, collection, new-arrivals and search pages.
 * Layout follows the reference collection page: centred title, a row of pill
 * tabs for the sub-categories, then a four-column grid. Filters live in the URL
 * so a filtered view is shareable and survives a reload.
 */
function CatalogViewInner({
  locale,
  dict,
  category,
  subcategories,
  collectionSlug,
  title,
  subtitle,
  breadcrumb,
  fixedQuery,
}: CatalogViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const page = Number(params.get('page')) || 1;
  const sort = (params.get('sort') as SortOption) || 'recommended';
  const delivery = params.get('delivery') ?? undefined;
  const band = params.get('price') ?? undefined;

  const bandValues = PRICE_BANDS.find((b) => b.key === band);

  const query = useMemo(
    () => ({
      page,
      limit: 24,
      sort,
      category: category?.slug,
      collection: collectionSlug,
      q: fixedQuery,
      delivery,
      min: bandValues?.min,
      max: bandValues?.max,
    }),
    [page, sort, category?.slug, collectionSlug, fixedQuery, delivery, bandValues],
  );

  const { data, isLoading, isError, refetch } = useProducts(query);

  const setParam = useCallback(
    (key: string, value?: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      if (key !== 'page') next.delete('page');
      router.push(`${pathname}?${next.toString()}`, { scroll: key === 'page' });
    },
    [params, pathname, router],
  );

  const hasFilters = Boolean(delivery || band);

  const filterPills = (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-center lg:gap-8">
      <div className="flex flex-wrap gap-2 lg:justify-center">
        {PRICE_BANDS.map((item) => (
          <FilterPill
            key={item.key}
            active={band === item.key}
            onClick={() => setParam('price', band === item.key ? undefined : item.key)}
          >
            {item.max ? `${formatNumber(item.min)} – ${formatNumber(item.max)}֏` : `${formatNumber(item.min)}֏+`}
          </FilterPill>
        ))}
      </div>

      <span className="hidden h-4 w-px bg-line lg:block" aria-hidden />

      <div className="flex flex-wrap gap-2 lg:justify-center">
        {(['quick', 'parcel', 'pickup'] as const).map((method) => (
          <FilterPill
            key={method}
            active={delivery === method}
            onClick={() => setParam('delivery', delivery === method ? undefined : method)}
          >
            {dict.delivery[method]}
          </FilterPill>
        ))}
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={() => router.push(pathname)}
          className="self-start text-[12px] text-ink-soft underline underline-offset-2 hover:text-brand lg:self-auto"
        >
          {dict.common.reset}
        </button>
      )}
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-[1292px] px-4 py-6 lg:py-10">
      <Breadcrumb items={breadcrumb} />

      <header className="mt-8 text-center lg:mt-12">
        <h1 className="text-[24px] font-bold tracking-tight text-ink-strong lg:text-[30px]">{title}</h1>
        {subtitle && (
          <p className="mx-auto mt-3 max-w-2xl text-[13.5px] leading-relaxed text-ink-soft">{subtitle}</p>
        )}
      </header>

      {subcategories && subcategories.length > 0 && (
        <nav className="mt-7 flex flex-wrap justify-center gap-2" aria-label={dict.catalog.subcategories}>
          {category && (
            <Link
              href={localePath(locale, `/catalog/${category.slug}`)}
              className="h-9 rounded-pill bg-brand px-5 text-[13px] font-medium leading-9 text-white"
            >
              {dict.home.allTab}
            </Link>
          )}
          {subcategories.map((child) => (
            <Link
              key={child.id}
              href={localePath(locale, `/catalog/${child.slug}`)}
              className="h-9 rounded-pill border border-line bg-white px-5 text-[13px] font-medium leading-[34px] text-ink-muted transition-colors duration-fast hover:border-ink-soft hover:text-ink"
            >
              {pickLocalized(child.name, locale)}
            </Link>
          ))}
        </nav>
      )}

      <div className="mt-8 hidden lg:block">{filterPills}</div>

      <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-b border-line-soft pb-4">
        <p className="text-[12.5px] text-ink-soft">
          <strong className="font-semibold text-ink">{data?.pagination.total ?? 0}</strong> {dict.catalog.results}
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className={cn(
              'flex h-9 items-center gap-1.5 rounded-pill border px-4 text-[12px] transition-colors duration-fast lg:hidden',
              hasFilters ? 'border-brand text-brand' : 'border-line text-ink-muted',
            )}
          >
            <FilterIcon className="h-3.5 w-3.5" />
            {dict.catalog.filters}
          </button>

          <label className="sr-only" htmlFor="catalog-sort">
            {dict.catalog.sort}
          </label>
          <select
            id="catalog-sort"
            value={sort}
            onChange={(event) => setParam('sort', event.target.value)}
            className="h-9 rounded-pill border border-line bg-white px-4 text-[12.5px] text-ink outline-none transition-colors duration-fast focus:border-brand"
          >
            {SORTS.map((option) => (
              <option key={option.key} value={option.key}>
                {dict.catalog[option.label]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-9">
        {isLoading ? (
          <ProductGridSkeleton count={12} />
        ) : isError ? (
          <EmptyState
            title={dict.common.error}
            description={dict.common.retry}
            action={
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-2 rounded-pill border border-line-strong px-4 py-2 text-[12px] hover:border-brand hover:text-brand"
              >
                {dict.common.retry}
              </button>
            }
          />
        ) : data && data.items.length > 0 ? (
          <>
            <ProductGrid products={data.items} locale={locale} dict={dict} />
            <Pagination
              page={data.pagination.page}
              totalPages={data.pagination.totalPages}
              onChange={(next) => setParam('page', String(next))}
            />
          </>
        ) : (
          <EmptyState title={dict.catalog.noResults} description={dict.catalog.noResultsHint} />
        )}
      </div>

      <Drawer open={filtersOpen} onClose={() => setFiltersOpen(false)} title={dict.catalog.filters} side="left">
        <div className="p-5">{filterPills}</div>
      </Drawer>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'h-9 rounded-pill px-4 text-[12.5px] font-medium transition-colors duration-fast',
        active
          ? 'bg-ink-strong text-white'
          : 'border border-line bg-white text-ink-muted hover:border-ink-soft hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}

/**
 * The listing reads its filters from the URL, so it must sit behind a Suspense
 * boundary. Owning that boundary here - instead of relying on a route-level
 * loading.tsx - keeps sibling routes free to answer with a real 404 instead of
 * committing a 200 as soon as the shell streams.
 */
export function CatalogView(props: CatalogViewProps) {
  return (
    <Suspense fallback={<CatalogFallback title={props.title} />}>
      <CatalogViewInner {...props} />
    </Suspense>
  );
}

function CatalogFallback({ title }: { title: string }) {
  // Loading placeholder: not a heading — the resolved content owns the page's only h1.
  return (
    <div className="mx-auto w-full max-w-[1292px] px-4 py-6 lg:py-10">
      <header className="mt-8 text-center lg:mt-12">
        <div className="text-[24px] font-bold tracking-tight text-ink-strong lg:text-[30px]">{title}</div>
      </header>
      <div className="mt-10">
        <ProductGridSkeleton count={12} />
      </div>
    </div>
  );
}
