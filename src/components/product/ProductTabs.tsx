'use client';

import { useState } from 'react';
import { cn, formatDate, maskName } from '@/lib/utils';
import { pickLocalized, type Dictionary, type Locale } from '@/lib/i18n';
import { useProductInquiries, useProductReviews } from '@/lib/hooks/useCatalog';
import { Tabs } from '@/components/ui/Display';
import { EmptyState, Pagination, Rating, Skeleton } from '@/components/ui/Feedback';
import { ReviewForm, InquiryForm } from './ProductForms';
import type { Product } from '@/types';

/**
 * Reference tab strip: 상세설명 / 상품후기 / 상품문의 / 배송·교환·반품.
 * Reviews and Q&A paginate independently and never block the description.
 */
export function ProductTabs({
  product,
  locale,
  dict,
}: {
  product: Product;
  locale: Locale;
  dict: Dictionary;
}) {
  const [tab, setTab] = useState('description');
  const [reviewPage, setReviewPage] = useState(1);
  const [inquiryPage, setInquiryPage] = useState(1);

  const reviews = useProductReviews(product.slug, reviewPage);
  const inquiries = useProductInquiries(product.slug, inquiryPage);

  return (
    <section className="mt-14 lg:mt-20">
      <Tabs
        active={tab}
        onChange={setTab}
        items={[
          { key: 'description', label: dict.product.tabDescription },
          { key: 'reviews', label: dict.product.tabReviews, count: product.ratingCount },
          { key: 'inquiries', label: dict.product.tabInquiries },
          { key: 'delivery', label: dict.product.tabDelivery },
        ]}
      />

      <div className="pt-8">
        {tab === 'description' && <DescriptionPane product={product} locale={locale} dict={dict} />}

        {tab === 'reviews' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-6 rounded-tile border border-line bg-surface-soft px-6 py-5">
              <div className="flex flex-col items-center">
                <span className="font-display text-[34px] font-bold leading-none text-ink-strong">
                  {product.ratingAverage.toFixed(1)}
                </span>
                <Rating value={product.ratingAverage} size={13} className="mt-1.5" />
                <span className="mt-1 text-[11px] text-ink-soft">
                  {product.ratingCount} {dict.product.reviewCount}
                </span>
              </div>
              <div className="flex-1">
                <ReviewForm productId={product.id} dict={dict} />
              </div>
            </div>

            {reviews.isLoading ? (
              <div className="flex flex-col gap-4">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : reviews.data && reviews.data.items.length > 0 ? (
              <>
                <ul className="flex flex-col divide-y divide-line-soft">
                  {reviews.data.items.map((review) => (
                    <li key={review.id} className="py-5">
                      <div className="flex flex-wrap items-center gap-3">
                        <Rating value={review.rating} size={12} />
                        <span className="text-[12px] font-medium text-ink">
                          {typeof review.user === 'object' ? maskName(review.user.name) : ''}
                        </span>
                        <span className="text-[11px] text-ink-faint">{formatDate(review.createdAt, locale)}</span>
                        {review.isVerified && (
                          <span className="rounded-pill bg-brand-50 px-2 py-0.5 text-[10px] text-brand-700">
                            {dict.status.completed}
                          </span>
                        )}
                      </div>
                      {review.title && <p className="mt-2 text-[13px] font-medium text-ink">{review.title}</p>}
                      <p className="mt-1.5 whitespace-pre-line text-[13px] leading-relaxed text-ink-muted">
                        {review.body}
                      </p>
                    </li>
                  ))}
                </ul>
                <Pagination
                  page={reviews.data.pagination.page}
                  totalPages={reviews.data.pagination.totalPages}
                  onChange={setReviewPage}
                />
              </>
            ) : (
              <EmptyState title={dict.product.noReviews} />
            )}
          </div>
        )}

        {tab === 'inquiries' && (
          <div className="flex flex-col gap-6">
            <InquiryForm productId={product.id} dict={dict} />

            {inquiries.isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : inquiries.data && inquiries.data.items.length > 0 ? (
              <>
                <ul className="flex flex-col divide-y divide-line-soft">
                  {inquiries.data.items.map((inquiry) => (
                    <li key={inquiry.id} className="py-5">
                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className={cn(
                            'rounded-pill px-2 py-0.5 text-[10px]',
                            inquiry.status === 'answered'
                              ? 'bg-brand-50 text-brand-700'
                              : 'bg-surface-soft text-ink-soft',
                          )}
                        >
                          {inquiry.status === 'answered' ? dict.product.answered : dict.product.open}
                        </span>
                        <span className="text-[12px] text-ink">
                          {typeof inquiry.user === 'object' ? maskName(inquiry.user.name) : ''}
                        </span>
                        <span className="text-[11px] text-ink-faint">{formatDate(inquiry.createdAt, locale)}</span>
                      </div>

                      {inquiry.redacted ? (
                        <p className="mt-2 text-[13px] italic text-ink-faint">{dict.product.secretHidden}</p>
                      ) : (
                        <>
                          <p className="mt-2 text-[13px] font-medium text-ink">{inquiry.subject}</p>
                          <p className="mt-1.5 whitespace-pre-line text-[13px] leading-relaxed text-ink-muted">
                            {inquiry.body}
                          </p>
                          {inquiry.answer && (
                            <div className="mt-3 rounded-card border-l-2 border-brand bg-surface-soft px-4 py-3">
                              <p className="whitespace-pre-line text-[12.5px] leading-relaxed text-ink-muted">
                                {inquiry.answer.body}
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </li>
                  ))}
                </ul>
                <Pagination
                  page={inquiries.data.pagination.page}
                  totalPages={inquiries.data.pagination.totalPages}
                  onChange={setInquiryPage}
                />
              </>
            ) : (
              <EmptyState title={dict.product.noInquiries} />
            )}
          </div>
        )}

        {tab === 'delivery' && <DeliveryPolicyPane dict={dict} />}
      </div>
    </section>
  );
}

function DescriptionPane({ product, locale, dict }: { product: Product; locale: Locale; dict: Dictionary }) {
  const rows = [
    { label: dict.product.sku, value: product.sku },
    { label: dict.product.origin, value: pickLocalized(product.origin, locale) },
    { label: dict.product.composition, value: pickLocalized(product.composition, locale) },
    { label: dict.product.careGuide, value: pickLocalized(product.careGuide, locale) },
  ].filter((row) => row.value);

  return (
    <div className="flex flex-col gap-8">
      <p className="max-w-3xl whitespace-pre-line text-[13.5px] leading-[1.9] text-ink-muted">
        {pickLocalized(product.description, locale) || pickLocalized(product.shortDescription, locale)}
      </p>

      {rows.length > 0 && (
        <dl className="grid max-w-2xl grid-cols-[110px_minmax(0,1fr)] gap-y-0 overflow-hidden rounded-tile border border-line text-[12.5px]">
          {rows.map((row) => (
            <div key={row.label} className="contents">
              <dt className="border-b border-line-soft bg-surface-soft px-4 py-3 font-medium text-ink-muted">
                {row.label}
              </dt>
              <dd className="border-b border-line-soft px-4 py-3 leading-relaxed text-ink">{row.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

function DeliveryPolicyPane({ dict }: { dict: Dictionary }) {
  const blocks = [
    { title: dict.delivery.quick, body: dict.delivery.quickDesc },
    { title: dict.delivery.parcel, body: dict.delivery.parcelDesc },
    { title: dict.delivery.pickup, body: dict.delivery.pickupDesc },
    { title: dict.delivery.notice, body: dict.delivery.noWeekendQuick },
    { title: dict.checkout.cashOnDelivery, body: dict.checkout.cashOnDeliveryHint },
  ];

  return (
    <div className="grid max-w-4xl gap-4 lg:grid-cols-2">
      {blocks.map((block) => (
        <div key={block.title} className="rounded-tile border border-line px-5 py-4">
          <p className="text-[13px] font-semibold text-ink-strong">{block.title}</p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-muted">{block.body}</p>
        </div>
      ))}
    </div>
  );
}
