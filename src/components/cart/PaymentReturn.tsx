'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { dateKey, formatPrice } from '@/lib/utils';
import { localePath, type Dictionary, type Locale } from '@/lib/i18n';
import { getLocalizedApiError } from '@/lib/api/errors';
import { paymentApi } from '@/lib/api/commerce';
import { qk } from '@/lib/queryKeys';
import { clearPendingPayment, readPendingPayment, redirectToProvider, savePendingPayment } from '@/lib/paymentFlow';
import type { PendingPaymentHint } from '@/lib/paymentFlow';
import { useUiStore } from '@/store/ui';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Feedback';
import { PaymentStatusBadge } from '@/components/account/OrderPieces';
import type { PaymentStatus } from '@/types';

/**
 * Landing page after a provider redirect (or after checkout for a payment that
 * settled immediately). It never trusts the redirect: the authoritative
 * payment state is fetched from the backend, which verifies the provider
 * server-to-server before a payment is ever marked paid.
 */
export function PaymentReturn({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const searchParams = useSearchParams();
  const client = useQueryClient();
  const notify = useUiStore((s) => s.notify);

  const queryToken = searchParams.get('token');
  // undefined = not resolved yet (SSR renders the skeleton), null = none stored.
  const [stored, setStored] = useState<PendingPaymentHint | null | undefined>(undefined);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    setStored(queryToken ? null : readPendingPayment());
  }, [queryToken]);

  const token = queryToken ?? stored?.token ?? null;
  const resolving = stored === undefined && !queryToken;

  const status = useQuery({
    queryKey: qk.paymentStatus(token ?? ''),
    queryFn: () => paymentApi.status(token as string, locale),
    enabled: Boolean(token),
    refetchInterval: (query) => (query.state.data?.payment.status === 'pending' ? 15000 : false),
  });

  const payment = status.data?.payment;
  const order = status.data?.order;

  useEffect(() => {
    if (payment?.status === 'paid') clearPendingPayment();
  }, [payment?.status]);

  const retry = async () => {
    if (!token) return;
    setStarting(true);
    try {
      const result = await paymentApi.start({ token, locale });
      if (result.kind === 'form' || result.kind === 'url') {
        savePendingPayment({
          token,
          orderCode: order?.code ?? stored?.orderCode ?? '',
          provider: result.payment.provider,
        });
        redirectToProvider(result);
        return;
      }
      client.invalidateQueries({ queryKey: qk.paymentStatus(token) });
      setStarting(false);
    } catch (error) {
      notify(getLocalizedApiError(error, locale), 'error');
      setStarting(false);
    }
  };

  if (resolving) return <Skeleton className="h-64 w-full" />;

  if (!token) {
    return (
      <div className="rounded-tile border border-line p-6 text-center">
        <p className="text-[13px] text-ink-muted">{dict.paymentReturn.missing}</p>
        <ButtonLink href={localePath(locale, '/')} size="lg" className="mt-4">
          {dict.orderComplete.backHome}
        </ButtonLink>
      </div>
    );
  }

  if (status.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-40 w-full" />
        <p className="text-center text-[12.5px] text-ink-muted">{dict.paymentReturn.processing}</p>
      </div>
    );
  }

  if (status.isError || !payment || !order) {
    return (
      <div className="rounded-tile border border-line p-6 text-center">
        <p className="text-[13px] text-ink-muted">{dict.checkout.errorGeneric}</p>
        <Button variant="outline" size="lg" className="mt-4" onClick={() => status.refetch()} loading={status.isFetching}>
          {dict.paymentReturn.refresh}
        </Button>
      </div>
    );
  }

  const view: Record<PaymentStatus, { title: string; hint: string; tone: string }> = {
    paid: {
      title: dict.paymentReturn.paidTitle,
      hint: dict.paymentReturn.paidHint,
      tone: 'border-olive/30 bg-olive/5',
    },
    pending: {
      title: dict.paymentReturn.pendingTitle,
      hint: dict.paymentReturn.pendingHint,
      tone: 'border-gold/40 bg-gold-wash/40',
    },
    failed: {
      title: dict.paymentReturn.failedTitle,
      hint: dict.paymentReturn.failedHint,
      tone: 'border-danger-soft/40 bg-danger-soft/5',
    },
    cancelled: {
      title: dict.paymentReturn.cancelledTitle,
      hint: dict.paymentReturn.cancelledHint,
      tone: 'border-danger-soft/40 bg-danger-soft/5',
    },
    refunded: {
      title: dict.status.paymentRefunded,
      hint: '',
      tone: 'border-line bg-surface-soft',
    },
  };
  const current = view[payment.status];

  return (
    <div className="flex flex-col gap-6">
      <div className={`rounded-tile border p-6 ${current.tone}`}>
        <p className="font-display text-[18px] font-bold tracking-tight text-ink-strong">{current.title}</p>
        {current.hint && <p className="mt-2 text-[12.5px] leading-relaxed text-ink-muted">{current.hint}</p>}

        <dl className="mt-5 flex flex-col gap-2 border-t border-line-soft pt-4 text-[12.5px]">
          <div className="flex justify-between gap-3">
            <dt className="text-ink-muted">{dict.paymentReturn.orderLabel}</dt>
            <dd className="font-semibold text-ink-strong">{order.code}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-ink-muted">{dict.checkout.paymentMethod}</dt>
            <dd>
              <PaymentStatusBadge status={payment.status} dict={dict} />
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-ink-muted">{dict.account.orderTotal}</dt>
            <dd className="font-semibold text-ink-strong">{formatPrice(order.total)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-ink-muted">{dict.checkout.deliveryInfo}</dt>
            <dd className="text-right">
              {order.delivery.recipient} ·{' '}
              {dict.regions[order.delivery.region as keyof Dictionary['regions']] ?? order.delivery.region}
              {order.delivery.city ? `, ${order.delivery.city}` : ''}
            </dd>
          </div>
          {order.delivery.requestedDate && (
            <div className="flex justify-between gap-3">
              <dt className="text-ink-muted">{dict.checkout.deliveryDate}</dt>
              <dd>
                {dateKey(order.delivery.requestedDate)}
                {order.delivery.timeSlot ? ` · ${order.delivery.timeSlot}` : ''}
              </dd>
            </div>
          )}
        </dl>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {(payment.status === 'failed' || payment.status === 'cancelled') && (
          <Button size="lg" onClick={retry} loading={starting}>
            {dict.checkout.retryPayment}
          </Button>
        )}
        {payment.status === 'pending' && (
          <Button variant="outline" size="lg" onClick={() => status.refetch()} loading={status.isFetching}>
            {dict.paymentReturn.refresh}
          </Button>
        )}
        <ButtonLink href={localePath(locale, '/')} variant="ghost" size="lg">
          {dict.orderComplete.backHome}
        </ButtonLink>
      </div>
    </div>
  );
}
