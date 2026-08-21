import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { serverGet } from '@/lib/api/client';
import { getDictionary, localePath, pickLocalized, type Locale } from '@/lib/i18n';
import { formatNumber } from '@/lib/utils';
import { Breadcrumb } from '@/components/ui/Display';
import { Rating } from '@/components/ui/Feedback';
import { BoltIcon } from '@/components/ui/Icons';
import { ProductGallery } from '@/components/product/ProductGallery';
import { PurchasePanel } from '@/components/product/PurchasePanel';
import { ProductTabs } from '@/components/product/ProductTabs';
import { ProductShareRow } from '@/components/product/ProductAside';
import { ProductCarousel, RecordRecentView } from '@/components/product/ProductCard';
import { HomeSectionHeader } from '@/components/home/HomeSections';
import type { ProductDetailResponse } from '@/types';

export const revalidate = 60;

interface Params {
  params: { locale: Locale; slug: string };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const data = await serverGet<ProductDetailResponse>(`/products/${params.slug}`);
  if (!data) return {};

  const name = pickLocalized(data.product.name, params.locale);
  const description = pickLocalized(data.product.shortDescription, params.locale);

  return {
    title: name,
    description,
    openGraph: {
      title: name,
      description,
      images: data.product.thumbnail ? [{ url: data.product.thumbnail }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Params) {
  const dict = getDictionary(params.locale);
  const data = await serverGet<ProductDetailResponse>(`/products/${params.slug}`);
  if (!data) notFound();

  const { product, breadcrumb, delivery, related } = data;
  const name = pickLocalized(product.name, params.locale);

  /** Points a new member would earn, shown next to the grade benefit line. */
  const signupPoints = Math.round(product.price * 0.07);

  const crumbs = [
    { label: dict.product.breadcrumbHome, href: localePath(params.locale, '/') },
    ...breadcrumb.map((item) => ({
      label: pickLocalized(item.name, params.locale),
      href: localePath(params.locale, `/catalog/${item.slug}`),
    })),
  ];

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 lg:py-10">
      <RecordRecentView product={product} locale={params.locale} />
      <Breadcrumb items={crumbs} />

      {/* the reference centres the name and tagline above both columns */}
      <header className="mt-8 text-center lg:mt-12">
        <h1 className="text-[24px] font-bold leading-snug tracking-tight text-ink-strong lg:text-[30px]">{name}</h1>
        {product.shortDescription && (
          <p className="mx-auto mt-3 max-w-2xl text-[13.5px] leading-relaxed text-ink-soft">
            {pickLocalized(product.shortDescription, params.locale)}
          </p>
        )}
      </header>

      <div className="mt-6 flex justify-end lg:mt-8">
        <ProductShareRow product={product} dict={dict} locale={params.locale} />
      </div>

      <div className="mt-4 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
        <ProductGallery images={product.images} alt={name} zoomLabel={dict.common.more} />

        <div className="flex flex-col">
          <p className="flex flex-wrap items-baseline gap-x-3 border-b border-line-soft pb-6">
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-[20px] font-bold text-danger-soft">
                {Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}%
              </span>
            )}
            <span className="text-[32px] font-bold leading-none tracking-tight text-brand lg:text-[36px]">
              {formatNumber(product.price)}
              <span className="ml-1 text-[17px] font-medium">֏</span>
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <s className="text-[15px] text-ink-faint">{formatNumber(product.compareAtPrice)}֏</s>
            )}
          </p>

          {/* spec rows: muted label column, value column */}
          <dl className="flex flex-col text-[13px]">
            <SpecRow label={dict.product.memberBenefit}>
              <span className="text-ink">
                {dict.product.memberDiscount}
                <span className="mx-1.5 text-line-strong">·</span>
                {formatNumber(signupPoints)}֏ {dict.product.memberPoints}
              </span>
            </SpecRow>

            <SpecRow label={dict.product.deliveryTerms}>
              <span className="flex flex-col gap-1.5">
                {product.sameDayAvailable && (
                  <span className="flex items-center gap-1 font-semibold text-quick">
                    <BoltIcon className="h-4 w-4" />
                    {dict.product.quickBadge}
                  </span>
                )}
                {delivery.map((option) => (
                  <span key={option.method} className="text-ink-muted">
                    {dict.delivery[option.method]}
                    <span className="mx-1.5 text-line-strong">:</span>
                    {dict.product.deliveryFrom} {option.earliestDate}
                  </span>
                ))}
              </span>
            </SpecRow>

            {product.ratingCount > 0 && (
              <SpecRow label={dict.product.tabReviews}>
                <span className="flex items-center gap-2">
                  <Rating value={product.ratingAverage} size={13} />
                  <span className="text-ink">{product.ratingAverage.toFixed(1)}</span>
                  <span className="text-ink-faint">
                    ({formatNumber(product.ratingCount)} {dict.product.reviewsShort})
                  </span>
                </span>
              </SpecRow>
            )}

            <SpecRow label={dict.product.sku}>
              <span className="text-ink-muted">{product.sku}</span>
            </SpecRow>
          </dl>

          <div className="mt-8">
            <PurchasePanel product={product} delivery={delivery} locale={params.locale} dict={dict} />
          </div>
        </div>
      </div>

      <ProductTabs product={product} locale={params.locale} dict={dict} />

      {related.length > 0 && (
        <section className="mt-16 lg:mt-24">
          <HomeSectionHeader title={dict.product.related} centered />
          <ProductCarousel products={related} locale={params.locale} dict={dict} />
        </section>
      )}
    </div>
  );
}

function SpecRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-5 border-b border-line-soft py-4">
      <dt className="w-[90px] shrink-0 text-ink-faint">{label}</dt>
      <dd className="min-w-0 flex-1 leading-relaxed">{children}</dd>
    </div>
  );
}
