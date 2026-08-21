'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { cn, formatDate, formatPrice } from '@/lib/utils';
import { localePath, type Dictionary, type Locale } from '@/lib/i18n';
import { useCart, useClearCart, useRemoveCartItem, useUpdateCartItem } from '@/lib/hooks/useCart';
import { Button, ButtonLink } from '@/components/ui/Button';
import { EmptyState, Skeleton } from '@/components/ui/Feedback';
import { ConfirmDialog } from '@/components/ui/Overlay';
import { MinusIcon, PlusIcon, TrashIcon, TruckIcon } from '@/components/ui/Icons';

export function CartView({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const { data, isLoading } = useCart();
  const update = useUpdateCartItem();
  const remove = useRemoveCartItem();
  const clear = useClearCart();
  const [confirmClear, setConfirmClear] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <EmptyState
        title={dict.cart.empty}
        description={dict.cart.emptyHint}
        action={
          <ButtonLink href={localePath(locale, '/catalog/flower-gifts')} size="lg" className="mt-2">
            {dict.cart.goShopping}
          </ButtonLink>
        }
      />
    );
  }

  const { totals } = data;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10">
      <div>
        <ul className="flex flex-col divide-y divide-line">
          {data.items.map((item) => (
            <li key={item.id} className="flex gap-4 py-5">
              <Link
                href={item.product ? localePath(locale, `/product/${item.product.slug}`) : '#'}
                className="relative h-24 w-24 shrink-0 overflow-hidden rounded-card bg-surface-soft lg:h-28 lg:w-28"
              >
                {item.product?.thumbnail && (
                  <Image src={item.product.thumbnail} alt={item.product.name} fill sizes="112px" className="object-cover" />
                )}
              </Link>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={item.product ? localePath(locale, `/product/${item.product.slug}`) : '#'}
                    className="text-[13.5px] font-medium leading-snug text-ink transition-colors duration-fast hover:text-brand"
                  >
                    {item.product?.name ?? '-'}
                  </Link>
                  <button
                    type="button"
                    onClick={() => remove.mutate(item.id)}
                    aria-label={dict.cart.remove}
                    className="shrink-0 text-ink-faint transition-colors duration-fast hover:text-danger-soft"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>

                <dl className="mt-2 flex flex-col gap-0.5 text-[11.5px] text-ink-soft">
                  <div className="flex gap-1.5">
                    <dt className="text-ink-faint">{dict.checkout.method}:</dt>
                    <dd className="flex items-center gap-1">
                      <TruckIcon className="h-3.5 w-3.5" />
                      {dict.delivery[item.deliveryMethod]}
                    </dd>
                  </div>
                  {item.deliveryDate && (
                    <div className="flex gap-1.5">
                      <dt className="text-ink-faint">{dict.checkout.deliveryDate}:</dt>
                      <dd>
                        {formatDate(item.deliveryDate, locale)}
                        {item.timeSlot ? ` · ${item.timeSlot}` : ''}
                      </dd>
                    </div>
                  )}
                  {item.options
                    .filter((option) => option.value && option.groupKey !== 'delivery_method')
                    .map((option) => (
                      <div key={option.groupKey} className="flex gap-1.5">
                        <dt className="text-ink-faint">{option.groupLabel}:</dt>
                        <dd className="truncate">
                          {option.value}
                          {option.priceDelta > 0 && (
                            <span className="ml-1 text-brand">+{formatPrice(option.priceDelta)}</span>
                          )}
                        </dd>
                      </div>
                    ))}
                </dl>

                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
                  <div className="flex h-9 items-center rounded-card border border-line">
                    <button
                      type="button"
                      onClick={() => update.mutate({ itemId: item.id, quantity: Math.max(1, item.quantity - 1) })}
                      aria-label="-"
                      className="flex h-full w-9 items-center justify-center text-ink-muted transition-colors duration-fast hover:text-brand"
                    >
                      <MinusIcon className="h-3 w-3" />
                    </button>
                    <span className="w-9 text-center text-[12.5px]">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => update.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
                      aria-label="+"
                      className="flex h-full w-9 items-center justify-center text-ink-muted transition-colors duration-fast hover:text-brand"
                    >
                      <PlusIcon className="h-3 w-3" />
                    </button>
                  </div>

                  <span className="text-[15px] font-semibold text-ink-strong">{formatPrice(item.lineTotal)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="flex justify-between pt-5">
          <Link
            href={localePath(locale, '/catalog/flower-gifts')}
            className="text-[12.5px] text-ink-muted underline underline-offset-2 hover:text-brand"
          >
            {dict.cart.continueShopping}
          </Link>
          <button
            type="button"
            onClick={() => setConfirmClear(true)}
            className="text-[12.5px] text-ink-faint underline underline-offset-2 hover:text-danger-soft"
          >
            {dict.cart.clear}
          </button>
        </div>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-tile border border-line p-5">
          <h2 className="text-[14px] font-semibold text-ink-strong">{dict.checkout.orderSummary}</h2>

          <dl className="mt-4 flex flex-col gap-2.5 text-[13px]">
            <Row label={dict.cart.subtotal} value={formatPrice(totals.subtotal)} />
            {totals.optionsTotal > 0 && (
              <Row label={dict.cart.optionsTotal} value={`+ ${formatPrice(totals.optionsTotal)}`} />
            )}
            {totals.gradeDiscount > 0 && (
              <Row
                label={`${dict.cart.gradeDiscount} (${Math.round(totals.gradeDiscountRate * 100)}%)`}
                value={`- ${formatPrice(totals.gradeDiscount)}`}
                tone="brand"
              />
            )}
            <Row label={dict.cart.deliveryFee} value={dict.checkout.deliveryInfo} tone="muted" />
          </dl>

          <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
            <span className="text-[13px] text-ink-muted">{dict.cart.total}</span>
            <span className="font-display text-[24px] font-bold tracking-tight text-ink-strong">
              {formatPrice(totals.merchandiseTotal - totals.gradeDiscount)}
            </span>
          </div>

          {totals.pointsEarned > 0 && (
            <p className="mt-1 text-right text-[11.5px] text-olive-dark">
              {dict.cart.pointsEarned} {formatPrice(totals.pointsEarned)}
            </p>
          )}

          <ButtonLink href={localePath(locale, '/checkout')} size="xl" fullWidth className="mt-5">
            {dict.cart.checkout}
          </ButtonLink>

          <p className="mt-3 rounded-card bg-surface-soft px-3 py-2.5 text-[11.5px] leading-relaxed text-ink-soft">
            {dict.checkout.cashOnDeliveryHint}
          </p>
        </div>
      </aside>

      <ConfirmDialog
        open={confirmClear}
        title={dict.cart.clear}
        message={dict.account.cancelConfirm}
        confirmLabel={dict.common.confirm}
        cancelLabel={dict.common.cancel}
        tone="danger"
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          clear.mutate();
          setConfirmClear(false);
        }}
      />
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: 'brand' | 'muted' }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-ink-muted">{label}</dt>
      <dd
        className={cn(
          'text-right',
          tone === 'brand' ? 'text-brand' : tone === 'muted' ? 'text-[11.5px] text-ink-faint' : 'text-ink',
        )}
      >
        {value}
      </dd>
    </div>
  );
}
