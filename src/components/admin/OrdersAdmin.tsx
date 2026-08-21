'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { formatDate, formatPrice } from '@/lib/utils';
import { defaultLocale, getDictionary } from '@/lib/i18n';
import { adminApi } from '@/lib/api/admin';
import { qk } from '@/lib/queryKeys';
import { useUiStore } from '@/store/ui';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { EmptyState, Pagination, Skeleton } from '@/components/ui/Feedback';
import { OrderStatusBadge, OrderTimeline, PaymentStatusBadge } from '@/components/account/OrderPieces';
import { AdminCard, AdminPageHeader, AdminTable } from './AdminShell';
import type { OrderStatus, PaymentStatus } from '@/types';

const STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'preparing',
  'delivering',
  'delivered',
  'completed',
  'cancelled',
];

/** Order queue: search, status filter, and a one-click move along the flow. */
export function OrdersAdmin() {
  const dict = getDictionary(defaultLocale);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [search, setSearch] = useState('');

  const params = { page, limit: 20, status: status || undefined, q: search || undefined };
  const { data, isLoading } = useQuery({
    queryKey: qk.adminOrders(params),
    queryFn: () => adminApi.orders(params),
  });

  return (
    <div className="flex flex-col gap-5">
      <AdminPageHeader title={dict.admin.orders} />

      <div className="flex flex-wrap gap-3">
        <Input
          id="order-search"
          placeholder={dict.common.search}
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          wrapperClassName="w-full sm:w-64"
        />
        <Select
          id="order-status"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as OrderStatus | '');
            setPage(1);
          }}
          wrapperClassName="w-full sm:w-52"
        >
          <option value="">{dict.common.all}</option>
          {STATUSES.map((value) => (
            <option key={value} value={value}>
              {dict.status[value]}
            </option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : !data || data.items.length === 0 ? (
        <EmptyState title={dict.common.empty} />
      ) : (
        <>
          <AdminTable
            head={[
              '#',
              dict.checkout.customer,
              dict.checkout.deliveryDate,
              dict.account.orderTotal,
              dict.checkout.payment,
              dict.account.orderStatus,
            ]}
          >
            {data.items.map((order) => (
              <tr key={order.id} className="text-[12.5px]">
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${order.id}`} className="font-medium text-brand hover:underline">
                    {order.code}
                  </Link>
                  <span className="mt-0.5 block text-[11px] text-ink-faint">
                    {formatDate(order.createdAt, defaultLocale)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {order.customer.name}
                  <span className="mt-0.5 block text-[11px] text-ink-faint">{order.customer.phone}</span>
                </td>
                <td className="px-4 py-3 text-ink-soft">
                  {formatDate(order.delivery.requestedDate, defaultLocale)}
                  {order.delivery.timeSlot ? ` · ${order.delivery.timeSlot}` : ''}
                </td>
                <td className="px-4 py-3 font-medium">{formatPrice(order.total)}</td>
                <td className="px-4 py-3">
                  <PaymentStatusBadge status={order.paymentStatus} dict={dict} />
                </td>
                <td className="px-4 py-3">
                  <OrderStatusBadge status={order.status} dict={dict} />
                </td>
              </tr>
            ))}
          </AdminTable>

          <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}

/** Single order: full detail plus the status / payment / note controls. */
export function OrderDetailAdmin({ id }: { id: string }) {
  const dict = getDictionary(defaultLocale);
  const client = useQueryClient();
  const notify = useUiStore((s) => s.notify);

  const { data: order, isLoading } = useQuery({
    queryKey: qk.adminOrder(id),
    queryFn: () => adminApi.order(id),
  });

  const [note, setNote] = useState('');
  const [statusNote, setStatusNote] = useState('');

  const invalidate = () => {
    client.invalidateQueries({ queryKey: qk.adminOrder(id) });
    client.invalidateQueries({ queryKey: ['admin-orders'] });
    client.invalidateQueries({ queryKey: qk.adminStats });
  };

  const changeStatus = useMutation({
    mutationFn: (next: OrderStatus) => adminApi.setOrderStatus(id, next, statusNote || undefined),
    onSuccess: () => {
      setStatusNote('');
      invalidate();
      notify(dict.common.save, 'success');
    },
    onError: (error: Error) => notify(error.message, 'error'),
  });

  const changePayment = useMutation({
    mutationFn: (next: PaymentStatus) => adminApi.setPaymentStatus(id, next),
    onSuccess: () => {
      invalidate();
      notify(dict.common.save, 'success');
    },
    onError: (error: Error) => notify(error.message, 'error'),
  });

  const saveNote = useMutation({
    mutationFn: () => adminApi.setOrderNote(id, note),
    onSuccess: () => {
      invalidate();
      notify(dict.common.save, 'success');
    },
  });

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (!order) return <EmptyState title={dict.common.error} />;

  const flow: Record<OrderStatus, OrderStatus[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['preparing', 'cancelled'],
    preparing: ['delivering', 'cancelled'],
    delivering: ['delivered', 'cancelled'],
    delivered: ['completed'],
    completed: [],
    cancelled: [],
  };

  return (
    <div className="flex flex-col gap-5">
      <AdminPageHeader
        title={order.code}
        description={formatDate(order.createdAt, defaultLocale, true)}
        action={
          <div className="flex items-center gap-2">
            <PaymentStatusBadge status={order.paymentStatus} dict={dict} />
            <OrderStatusBadge status={order.status} dict={dict} />
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <AdminCard>
            <p className="mb-3 text-[13px] font-semibold text-ink-strong">{dict.cart.item}</p>
            <ul className="flex flex-col divide-y divide-line-soft">
              {order.items.map((item, index) => (
                <li key={`${item.sku}-${index}`} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex justify-between gap-3 text-[12.5px]">
                    <span className="font-medium text-ink">
                      {item.name} × {item.quantity}
                    </span>
                    <span>{formatPrice(item.lineTotal)}</span>
                  </div>
                  <dl className="mt-1 flex flex-col gap-0.5 text-[11.5px] text-ink-soft">
                    {item.options
                      .filter((option) => option.value)
                      .map((option) => (
                        <div key={option.groupKey} className="flex gap-1.5">
                          <dt className="text-ink-faint">{option.groupLabel}:</dt>
                          <dd>{option.value}</dd>
                        </div>
                      ))}
                    {item.ribbonText && (
                      <div className="flex gap-1.5">
                        <dt className="text-ink-faint">{dict.product.ribbon}:</dt>
                        <dd>{item.ribbonText}</dd>
                      </div>
                    )}
                    {item.cardMessage && (
                      <div className="flex gap-1.5">
                        <dt className="text-ink-faint">{dict.product.cardMessage}:</dt>
                        <dd className="whitespace-pre-line">{item.cardMessage}</dd>
                      </div>
                    )}
                  </dl>
                </li>
              ))}
            </ul>

            <dl className="mt-4 flex flex-col gap-1.5 border-t border-line pt-4 text-[12.5px]">
              <Row label={dict.cart.subtotal} value={formatPrice(order.subtotal + order.optionsTotal)} />
              {order.gradeDiscount > 0 && (
                <Row label={dict.cart.gradeDiscount} value={`- ${formatPrice(order.gradeDiscount)}`} />
              )}
              <Row label={dict.cart.deliveryFee} value={formatPrice(order.deliveryFee)} />
              {order.pointsUsed > 0 && (
                <Row label={dict.checkout.usePoints} value={`- ${formatPrice(order.pointsUsed)}`} />
              )}
              <div className="mt-2 flex justify-between border-t border-line-soft pt-2 text-[15px] font-semibold">
                <span>{dict.cart.total}</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </dl>
          </AdminCard>

          <AdminCard>
            <p className="mb-3 text-[13px] font-semibold text-ink-strong">{dict.checkout.deliveryInfo}</p>
            <dl className="flex flex-col gap-1.5 text-[12.5px]">
              <Row label={dict.checkout.method} value={dict.delivery[order.delivery.method]} />
              <Row label={dict.checkout.recipientName} value={order.delivery.recipient} />
              <Row label={dict.checkout.phone} value={order.delivery.phone} />
              <Row
                label={dict.checkout.region}
                value={dict.regions[order.delivery.region as keyof typeof dict.regions] ?? order.delivery.region}
              />
              <Row
                label={dict.checkout.street}
                value={`${order.delivery.city}, ${order.delivery.street} ${order.delivery.building ?? ''} ${order.delivery.apartment ?? ''}`}
              />
              <Row
                label={dict.checkout.deliveryDate}
                value={`${formatDate(order.delivery.requestedDate, defaultLocale)}${order.delivery.timeSlot ? ` · ${order.delivery.timeSlot}` : ''}`}
              />
              {order.delivery.notes && <Row label={dict.checkout.notes} value={order.delivery.notes} />}
            </dl>
          </AdminCard>

          <AdminCard>
            <p className="mb-3 text-[13px] font-semibold text-ink-strong">{dict.checkout.customer}</p>
            <dl className="flex flex-col gap-1.5 text-[12.5px]">
              <Row label={dict.checkout.name} value={order.customer.name} />
              <Row label={dict.checkout.email} value={order.customer.email} />
              <Row label={dict.checkout.phone} value={order.customer.phone} />
            </dl>
            {order.customerNote && (
              <p className="mt-3 rounded-card bg-surface-soft px-3 py-2 text-[12px] text-ink-muted">
                {order.customerNote}
              </p>
            )}
          </AdminCard>
        </div>

        <div className="flex flex-col gap-4">
          <AdminCard>
            <p className="mb-3 text-[13px] font-semibold text-ink-strong">{dict.admin.changeStatus}</p>
            <OrderTimeline order={order} dict={dict} locale={defaultLocale} className="mb-4" />

            <Textarea
              id="status-note"
              label={dict.checkout.notes}
              value={statusNote}
              onChange={(event) => setStatusNote(event.target.value)}
            />

            <div className="mt-3 flex flex-wrap gap-2">
              {flow[order.status].map((next) => (
                <Button
                  key={next}
                  size="sm"
                  variant={next === 'cancelled' ? 'outline' : 'primary'}
                  loading={changeStatus.isPending}
                  onClick={() => changeStatus.mutate(next)}
                >
                  {dict.status[next]}
                </Button>
              ))}
              {flow[order.status].length === 0 && (
                <p className="text-[12px] text-ink-faint">{dict.status[order.status]}</p>
              )}
            </div>
          </AdminCard>

          <AdminCard>
            <p className="mb-3 text-[13px] font-semibold text-ink-strong">{dict.admin.changePayment}</p>
            <div className="flex flex-wrap gap-2">
              {(['pending', 'paid', 'refunded'] as PaymentStatus[]).map((value) => (
                <Button
                  key={value}
                  size="sm"
                  variant={order.paymentStatus === value ? 'primary' : 'outline'}
                  onClick={() => changePayment.mutate(value)}
                >
                  {value === 'paid'
                    ? dict.status.paymentPaid
                    : value === 'refunded'
                      ? dict.status.paymentRefunded
                      : dict.status.paymentPending}
                </Button>
              ))}
            </div>
            <p className="mt-3 text-[11.5px] leading-relaxed text-ink-faint">{dict.checkout.cashOnDeliveryHint}</p>
          </AdminCard>

          <AdminCard>
            <Textarea
              id="admin-note"
              label={dict.checkout.notes}
              defaultValue={order.adminNote ?? ''}
              onChange={(event) => setNote(event.target.value)}
            />
            <Button className="mt-3" size="md" fullWidth loading={saveNote.isPending} onClick={() => saveNote.mutate()}>
              {dict.common.save}
            </Button>
          </AdminCard>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="shrink-0 text-ink-muted">{label}</dt>
      <dd className="text-right text-ink">{value}</dd>
    </div>
  );
}
