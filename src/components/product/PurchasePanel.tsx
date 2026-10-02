'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { formatPrice } from '@/lib/utils';
import { localePath, pickLocalized, type Dictionary, type Locale } from '@/lib/i18n';
import { useAddToCart } from '@/lib/hooks/useCart';
import { useUiStore } from '@/store/ui';
import { Button } from '@/components/ui/Button';
import { MinusIcon, PlusIcon } from '@/components/ui/Icons';
import type { DeliveryMethod, Product } from '@/types';

interface PurchasePanelProps {
  product: Product;
  locale: Locale;
  dict: Dictionary;
}

type OptionState = Record<string, string>;

/**
 * Product-level configuration only: personalization, paid add-ons and quantity.
 * Customer, recipient and delivery details live on Checkout, which is the single
 * form for them, so "buy now" adds the line and hands over to Checkout.
 */
export function PurchasePanel({ product, locale, dict }: PurchasePanelProps) {
  const router = useRouter();
  const addToCart = useAddToCart();
  const notify = useUiStore((s) => s.notify);

  const addonGroups = product.optionGroups.filter((g) => g.type === 'select' && g.key !== 'delivery_method');
  const textGroups = product.optionGroups.filter((g) => ['text', 'textarea'].includes(g.type));

  /** The cart contract requires a method; Checkout is where the buyer picks one. */
  const deliveryMethod = (product.deliveryMethods[0] ?? 'quick') as DeliveryMethod;

  const [quantity, setQuantity] = useState(product.minOrderQty || 1);
  const [options, setOptions] = useState<OptionState>({});
  const [texts, setTexts] = useState<OptionState>({});

  const addonTotal = useMemo(() => {
    return addonGroups.reduce((acc, group) => {
      const chosen = group.options.find((o) => o.key === options[group.key]);
      return acc + (chosen?.priceDelta ?? 0);
    }, 0);
  }, [addonGroups, options]);

  const total = (product.price + addonTotal) * quantity;

  const isOutOfStock = product.trackStock && product.stock === 0;
  const busy = addToCart.isPending || isOutOfStock;

  const buildPayload = () => ({
    productId: product.id,
    quantity,
    deliveryMethod,
    ribbonText: texts.ribbon || undefined,
    senderName: texts.sender || undefined,
    cardMessage: texts.card_message || undefined,
    options: [
      ...addonGroups
        .filter((group) => options[group.key])
        .map((group) => ({ groupKey: group.key, optionKey: options[group.key] })),
      ...textGroups
        .filter((group) => texts[group.key])
        .map((group) => ({ groupKey: group.key, value: texts[group.key] })),
    ],
  });

  const submit = async (goToCheckout: boolean) => {
    await addToCart.mutateAsync(buildPayload());
    if (goToCheckout) router.push(localePath(locale, '/checkout'));
    else notify(dict.product.addToCart, 'success');
  };

  return (
    <div className="flex flex-col gap-5">
      {/* free message fields */}
      {textGroups.length > 0 && (
        <section className="flex flex-col gap-3">
          {textGroups.map((group) => (
            <div key={group.key}>
              <label htmlFor={`opt-${group.key}`} className="mb-1.5 block text-[12px] font-semibold text-ink-strong">
                {pickLocalized(group.label, locale)}
              </label>
              {group.type === 'textarea' ? (
                <textarea
                  id={`opt-${group.key}`}
                  maxLength={group.maxLength}
                  value={texts[group.key] ?? ''}
                  onChange={(event) => setTexts((s) => ({ ...s, [group.key]: event.target.value }))}
                  rows={3}
                  className="w-full resize-y rounded-card border border-line px-3 py-2.5 text-[13px] leading-relaxed outline-none transition-colors duration-fast focus:border-brand"
                />
              ) : (
                <input
                  id={`opt-${group.key}`}
                  maxLength={group.maxLength}
                  value={texts[group.key] ?? ''}
                  onChange={(event) => setTexts((s) => ({ ...s, [group.key]: event.target.value }))}
                  className="h-11 w-full rounded-card border border-line px-3 text-[13px] outline-none transition-colors duration-fast focus:border-brand"
                />
              )}
              {group.helpText && (
                <p className="mt-1 text-[11px] text-ink-faint">{pickLocalized(group.helpText, locale)}</p>
              )}
            </div>
          ))}
        </section>
      )}

      {/* paid add-ons */}
      {addonGroups.length > 0 && (
        <section>
          <p className="mb-2 text-[12px] font-semibold text-ink-strong">{dict.product.addons}</p>
          <div className="flex flex-col gap-2">
            {addonGroups.map((group) => (
              <div key={group.key}>
                <label htmlFor={`addon-${group.key}`} className="sr-only">
                  {pickLocalized(group.label, locale)}
                </label>
                <select
                  id={`addon-${group.key}`}
                  value={options[group.key] ?? ''}
                  onChange={(event) => setOptions((s) => ({ ...s, [group.key]: event.target.value }))}
                  className="h-11 w-full rounded-card border border-line bg-white px-3 text-[13px] outline-none transition-colors duration-fast focus:border-brand"
                >
                  <option value="">- {pickLocalized(group.label, locale)} -</option>
                  {group.options
                    .filter((option) => option.isAvailable)
                    .map((option) => (
                      <option key={option.key} value={option.key}>
                        {pickLocalized(option.label, locale)}
                        {option.priceDelta > 0 ? ` (+${formatPrice(option.priceDelta)})` : ''}
                      </option>
                    ))}
                </select>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* quantity */}
      <section className="flex items-center justify-between">
        <span className="text-[12px] font-semibold text-ink-strong">{dict.product.quantity}</span>
        <div className="flex h-10 items-center rounded-card border border-line">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(product.minOrderQty || 1, q - 1))}
            aria-label="-"
            className="flex h-full w-10 items-center justify-center text-ink-muted transition-colors duration-fast hover:text-brand"
          >
            <MinusIcon className="h-3.5 w-3.5" />
          </button>
          <span className="w-10 text-center text-[13px] font-medium">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(product.maxOrderQty || 20, q + 1))}
            aria-label="+"
            className="flex h-full w-10 items-center justify-center text-ink-muted transition-colors duration-fast hover:text-brand"
          >
            <PlusIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </section>

      {/* running total */}
      <section className="flex items-baseline justify-between border-t border-line pt-4">
        <span className="text-[13px] text-ink-muted">{dict.product.totalAmount}</span>
        <span className="font-display text-[26px] font-bold tracking-tight text-ink-strong">
          {formatPrice(total)}
        </span>
      </section>

      {isOutOfStock && (
        <p className="rounded-card border border-danger-soft px-4 py-3 text-center text-[12.5px] font-semibold text-danger-soft">
          {dict.product.outOfStock}
        </p>
      )}

      <div className="flex gap-2">
        <Button variant="outline" size="xl" fullWidth onClick={() => submit(false)} loading={addToCart.isPending} disabled={busy}>
          {dict.product.addToCart}
        </Button>
        <Button variant="primary" size="xl" fullWidth onClick={() => submit(true)} loading={addToCart.isPending} disabled={busy}>
          {dict.product.buyNow}
        </Button>
      </div>
    </div>
  );
}
