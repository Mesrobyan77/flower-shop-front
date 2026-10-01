'use client';

import { cn, formatDate } from '@/lib/utils';
import type { Dictionary, Locale } from '@/lib/i18n';
import type { Order, OrderStatus, PaymentStatus } from '@/types';

const STATUS_TONE: Record<OrderStatus, string> = {
  pending: 'bg-surface-soft text-ink-muted border-line',
  confirmed: 'bg-brand-50 text-brand-700 border-brand/30',
  preparing: 'bg-gold-wash text-ink border-gold/40',
  delivering: 'bg-olive/10 text-olive-dark border-olive/30',
  delivered: 'bg-brand-50 text-brand-700 border-brand/30',
  completed: 'bg-brand text-white border-brand',
  cancelled: 'bg-danger-soft/10 text-danger-soft border-danger-soft/30',
};

/** The status chain the reference used: 주문결제 > 상품제작 > 배송 > 배송완료. */
export const STATUS_FLOW: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'delivering', 'delivered', 'completed'];

export function OrderStatusBadge({ status, dict }: { status: OrderStatus; dict: Dictionary }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-pill border px-2.5 py-1 text-[11px] font-medium',
        STATUS_TONE[status],
      )}
    >
      {dict.status[status]}
    </span>
  );
}

export const PAYMENT_STATUS_KEY: Record<PaymentStatus, keyof Dictionary['status']> = {
  pending: 'paymentPending',
  paid: 'paymentPaid',
  failed: 'paymentFailed',
  cancelled: 'paymentCancelled',
  refunded: 'paymentRefunded',
};

export function PaymentStatusBadge({ status, dict }: { status: PaymentStatus; dict: Dictionary }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-pill border px-2.5 py-1 text-[11px]',
        status === 'paid'
          ? 'border-olive/30 bg-olive/10 text-olive-dark'
          : status === 'failed' || status === 'cancelled'
            ? 'border-danger-soft/30 bg-danger-soft/10 text-danger-soft'
            : status === 'refunded'
              ? 'border-line bg-surface-soft text-ink-muted'
              : 'border-gold/40 bg-gold-wash text-ink',
      )}
    >
      {dict.status[PAYMENT_STATUS_KEY[status]]}
    </span>
  );
}

export function OrderTimeline({
  order,
  dict,
  locale,
  className,
}: {
  order: Order;
  dict: Dictionary;
  locale: Locale;
  className?: string;
}) {
  if (order.status === 'cancelled') {
    return (
      <div className={cn('rounded-card border border-danger-soft/30 bg-danger-soft/5 px-4 py-3', className)}>
        <p className="text-[12.5px] font-medium text-danger-soft">{dict.status.cancelled}</p>
        {order.statusHistory.at(-1)?.note && (
          <p className="mt-1 text-[11.5px] text-ink-muted">{order.statusHistory.at(-1)?.note}</p>
        )}
      </div>
    );
  }

  const currentIndex = STATUS_FLOW.indexOf(order.status);
  const reached = (status: OrderStatus) => STATUS_FLOW.indexOf(status) <= currentIndex;
  const historyFor = (status: OrderStatus) => order.statusHistory.find((entry) => entry.status === status);

  return (
    <ol className={cn('flex flex-col gap-0', className)}>
      {STATUS_FLOW.map((status, index) => {
        const done = reached(status);
        const entry = historyFor(status);

        return (
          <li key={status} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px]',
                  done ? 'border-brand bg-brand text-white' : 'border-line bg-white text-ink-faint',
                )}
              >
                {index + 1}
              </span>
              {index < STATUS_FLOW.length - 1 && (
                <span className={cn('h-6 w-px', done ? 'bg-brand/40' : 'bg-line')} aria-hidden />
              )}
            </div>

            <div className="pb-1">
              <p className={cn('text-[12.5px]', done ? 'font-medium text-ink' : 'text-ink-faint')}>
                {dict.status[status]}
              </p>
              {entry && <p className="text-[11px] text-ink-faint">{formatDate(entry.changedAt, locale, true)}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
