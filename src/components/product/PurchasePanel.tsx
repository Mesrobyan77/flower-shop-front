'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { cn, formatPrice } from '@/lib/utils';
import { localePath, pickLocalized, type Dictionary, type Locale } from '@/lib/i18n';
import { useAddToCart } from '@/lib/hooks/useCart';
import { useUiStore } from '@/store/ui';
import { Button } from '@/components/ui/Button';
import { MinusIcon, PlusIcon, TruckIcon } from '@/components/ui/Icons';
import type { DeliveryMethod, DeliveryOption, Product } from '@/types';

interface PurchasePanelProps {
  product: Product;
  delivery: DeliveryOption[];
  locale: Locale;
  dict: Dictionary;
}

type OptionState = Record<string, string>;

/**
 * The reference purchase sheet, in order:
 *   delivery method -> desired date -> time slot -> ribbon -> sender -> card
 *   message -> paid add-ons -> quantity -> running total -> cart / buy now.
 * Prices for add-ons come from the product definition; the panel only reports
 * the selection, the server recalculates the money.
 */
export function PurchasePanel({ product, delivery, locale, dict }: PurchasePanelProps) {
  const router = useRouter();
  const addToCart = useAddToCart();
  const notify = useUiStore((s) => s.notify);

  const methodGroup = product.optionGroups.find((g) => g.key === 'delivery_method');
  const addonGroups = product.optionGroups.filter((g) => g.type === 'select' && g.key !== 'delivery_method');
  const textGroups = product.optionGroups.filter((g) => ['text', 'textarea'].includes(g.type));

  const defaultMethod = (product.deliveryMethods[0] ?? 'quick') as DeliveryMethod;
  const [method, setMethod] = useState<DeliveryMethod>(defaultMethod);
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('');
  const [quantity, setQuantity] = useState(product.minOrderQty || 1);
  const [options, setOptions] = useState<OptionState>({});
  const [texts, setTexts] = useState<OptionState>({});
  const [touched, setTouched] = useState(false);

  const activeDelivery = delivery.find((d) => d.method === method);
  const availableDates = (activeDelivery?.calendar ?? []).filter((d) => d.available);

  const addonTotal = useMemo(() => {
    return addonGroups.reduce((acc, group) => {
      const chosen = group.options.find((o) => o.key === options[group.key]);
      return acc + (chosen?.priceDelta ?? 0);
    }, 0);
  }, [addonGroups, options]);

  const total = (product.price + addonTotal) * quantity;

  const missingDate = !date;
  const isOutOfStock = product.trackStock && product.stock === 0;
  const busy = addToCart.isPending || isOutOfStock;

  const buildPayload = () => ({
    productId: product.id,
    quantity,
    deliveryMethod: method,
    deliveryDate: date || undefined,
    timeSlot: method === 'quick' && slot ? slot : undefined,
    ribbonText: texts.ribbon || undefined,
    senderName: texts.sender || undefined,
    cardMessage: texts.card_message || undefined,
    options: [
      ...(methodGroup ? [{ groupKey: methodGroup.key, optionKey: method }] : []),
      ...addonGroups
        .filter((group) => options[group.key])
        .map((group) => ({ groupKey: group.key, optionKey: options[group.key] })),
      ...textGroups
        .filter((group) => texts[group.key])
        .map((group) => ({ groupKey: group.key, value: texts[group.key] })),
    ],
  });

  const submit = async (goToCart: boolean) => {
    setTouched(true);
    if (missingDate) {
      notify(dict.validation.deliveryDateRequired, 'error');
      const field = document.getElementById('delivery-date');
      field?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      field?.focus({ preventScroll: true });
      return;
    }

    await addToCart.mutateAsync(buildPayload());
    if (goToCart) router.push(localePath(locale, '/cart'));
    else notify(dict.product.addToCart, 'success');
  };

  return (
    <div className="flex flex-col gap-5">
      {/* delivery method */}
      <section>
        <p className="mb-2 text-[12px] font-semibold text-ink-strong">{dict.checkout.method}</p>
        <div className="flex flex-col gap-2">
          {product.deliveryMethods.map((value) => {
            const option = delivery.find((d) => d.method === value);
            return (
              <label
                key={value}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-card border p-3 transition-colors duration-fast',
                  method === value ? 'border-brand bg-brand-50/50' : 'border-line hover:border-line-strong',
                )}
              >
                <input
                  type="radio"
                  name="delivery-method"
                  value={value}
                  checked={method === value}
                  onChange={() => {
                    setMethod(value);
                    setDate('');
                    setSlot('');
                  }}
                  className="mt-0.5 h-4 w-4 accent-brand"
                />
                <span className="flex-1">
                  <span className="block text-[13px] font-medium text-ink">{dict.delivery[value]}</span>
                  <span className="mt-0.5 block text-[11.5px] leading-relaxed text-ink-soft">
                    {dict.delivery[`${value}Desc` as 'quickDesc']}
                  </span>
                  {option && (
                    <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-olive-dark">
                      <TruckIcon className="h-3.5 w-3.5" />
                      {dict.product.deliveryFrom} {option.earliestDate}
                    </span>
                  )}
                </span>
              </label>
            );
          })}
        </div>
      </section>

      {/* desired date */}
      <section>
        <label htmlFor="delivery-date" className="mb-2 block text-[12px] font-semibold text-ink-strong">
          {dict.product.chooseDate} <span className="text-danger">*</span>
        </label>
        <select
          id="delivery-date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          className={cn(
            'h-11 w-full rounded-card border bg-white px-3 text-[13px] outline-none transition-colors duration-fast focus:border-brand',
            touched && missingDate ? 'border-danger-soft' : 'border-line',
          )}
        >
          <option value="">{dict.product.notSelected}</option>
          {availableDates.map((item) => (
            <option key={item.date} value={item.date}>
              {item.date}
            </option>
          ))}
        </select>
        {touched && missingDate && (
          <p className="mt-1 text-[11px] text-danger-soft">{dict.validation.deliveryDateRequired}</p>
        )}
      </section>

      {/* time slot - quick only, exactly as the reference restricted it */}
      {method === 'quick' && (activeDelivery?.timeSlots.length ?? 0) > 0 && (
        <section>
          <label htmlFor="delivery-slot" className="mb-2 block text-[12px] font-semibold text-ink-strong">
            {dict.product.chooseTime}
          </label>
          <select
            id="delivery-slot"
            value={slot}
            onChange={(event) => setSlot(event.target.value)}
            className="h-11 w-full rounded-card border border-line bg-white px-3 text-[13px] outline-none transition-colors duration-fast focus:border-brand"
          >
            <option value="">{dict.product.notSelected}</option>
            {activeDelivery?.timeSlots.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </section>
      )}

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
