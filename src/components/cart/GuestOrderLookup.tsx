'use client';

import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { formatDate, formatPrice } from '@/lib/utils';
import type { Dictionary, Locale } from '@/lib/i18n';
import { getLocalizedApiError } from '@/lib/api/errors';
import { orderApi } from '@/lib/api/commerce';
import { useUiStore } from '@/store/ui';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { OrderStatusBadge, OrderTimeline } from '@/components/account/OrderPieces';
import type { Order } from '@/types';

const EMAIL_RE = /^\S+@\S+\.\S+$/;
const FIELD_IDS: Record<string, string> = { code: 'lookup-code', email: 'lookup-email' };

/** Guest tab of the reference login page: find an order by number plus email. */
export function GuestOrderLookup({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const notify = useUiStore((s) => s.notify);
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [order, setOrder] = useState<Order | null>(null);

  const lookup = useMutation({
    mutationFn: () => orderApi.lookup({ code: code.trim(), email: email.trim() }),
    onSuccess: setOrder,
  });

  const updateField = (key: 'code' | 'email', value: string) => {
    if (key === 'code') setCode(value);
    else setEmail(value);
    setErrors((state) => {
      if (!state[key]) return state;
      const rest = { ...state };
      delete rest[key];
      return rest;
    });
  };

  const submit = () => {
    const next: Record<string, string> = {};
    if (!code.trim()) next.code = dict.validation.required;
    if (!email.trim()) next.email = dict.validation.emailRequired;
    else if (!EMAIL_RE.test(email.trim())) next.email = dict.validation.email;

    setErrors(next);
    if (Object.keys(next).length > 0) {
      notify(dict.checkout.requiredFieldsToast, 'error');
      const firstKey = Object.keys(FIELD_IDS).find((key) => next[key]);
      const field = firstKey ? document.getElementById(FIELD_IDS[firstKey]) : null;
      field?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      field?.focus({ preventScroll: true });
      return;
    }

    lookup.mutate();
  };

  return (
    <div className="mt-6 flex flex-col gap-5">
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        className="flex flex-col gap-4"
      >
        <Input
          id="lookup-code"
          label={dict.auth.orderNumber}
          required
          value={code}
          onChange={(event) => updateField('code', event.target.value)}
          error={errors.code}
          placeholder="XF-20260101-AB12C"
        />
        <Input
          id="lookup-email"
          type="email"
          label={dict.auth.email}
          required
          value={email}
          onChange={(event) => updateField('email', event.target.value)}
          error={errors.email}
        />
        {lookup.isError && (
          <p className="text-[12px] text-danger-soft">{getLocalizedApiError(lookup.error, locale)}</p>
        )}
        <Button type="submit" size="lg" fullWidth loading={lookup.isPending}>
          {dict.auth.lookup}
        </Button>
      </form>

      {order && (
        <div className="rounded-tile border border-line p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-display text-[16px] font-bold tracking-wide text-ink-strong">{order.code}</span>
            <OrderStatusBadge status={order.status} dict={dict} />
          </div>

          <dl className="mt-4 flex flex-col gap-2 text-[12.5px]">
            <div className="flex justify-between">
              <dt className="text-ink-muted">{dict.account.orderDate}</dt>
              <dd>{formatDate(order.createdAt, locale, true)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-muted">{dict.checkout.deliveryDate}</dt>
              <dd>
                {formatDate(order.delivery.requestedDate, locale)}
                {order.delivery.timeSlot ? ` · ${order.delivery.timeSlot}` : ''}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-muted">{dict.account.orderTotal}</dt>
              <dd className="font-semibold text-ink-strong">{formatPrice(order.total)}</dd>
            </div>
          </dl>

          <ul className="mt-4 flex flex-col gap-2 border-t border-line-soft pt-4 text-[12.5px]">
            {order.items.map((item, index) => (
              <li key={`${item.sku}-${index}`} className="flex justify-between gap-3">
                <span className="min-w-0 flex-1 truncate text-ink-muted">
                  {item.name} × {item.quantity}
                </span>
                <span className="shrink-0">{formatPrice(item.lineTotal)}</span>
              </li>
            ))}
          </ul>

          <OrderTimeline order={order} dict={dict} locale={locale} className="mt-5" />
        </div>
      )}
    </div>
  );
}
