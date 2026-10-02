'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { cn, formatDate, formatPrice } from '@/lib/utils';
import { localePath, pickLocalized, type Dictionary, type Locale } from '@/lib/i18n';
import { accountApi, type AddressBody } from '@/lib/api/account';
import { orderApi } from '@/lib/api/commerce';
import { authApi } from '@/lib/api/auth';
import { catalogApi } from '@/lib/api/catalog';
import { qk } from '@/lib/queryKeys';
import {
  useAccountSummary,
  useAddresses,
  useCancelOrder,
  useDeleteAddress,
  useMyOrders,
  useSaveAddress,
  useSubscriptions,
  useToggleWishlist,
  useWishlist,
} from '@/lib/hooks/useAccount';
import { useAppConfig } from '@/lib/hooks/useCatalog';
import { useApiError } from '@/lib/hooks/useApiError';
import { useSession } from '@/lib/hooks/useAuth';
import { useAuthStore } from '@/store/auth';
import { useUiStore } from '@/store/ui';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Checkbox, Input, Select, Textarea } from '@/components/ui/Input';
import { ConfirmDialog, Modal } from '@/components/ui/Overlay';
import { EmptyState, Pagination, Skeleton } from '@/components/ui/Feedback';
import { HeartIcon, TrashIcon } from '@/components/ui/Icons';
import { OrderStatusBadge, OrderTimeline, PaymentStatusBadge } from './OrderPieces';
import type { Address } from '@/types';

/* ------------------------------- dashboard ------------------------------- */

export function AccountDashboard({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const { data: summary, isLoading } = useAccountSummary();
  const orders = useMyOrders(1);

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  const nextGrade = summary?.grade.next;
  const progress = nextGrade
    ? Math.min(100, Math.round(((summary?.totalSpend ?? 0) / nextGrade.minSpend) * 100))
    : 100;

  return (
    <div className="flex flex-col gap-8">
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: dict.account.orders, value: String(summary?.orderCount ?? 0) },
          { label: dict.account.points, value: formatPrice(summary?.points ?? 0) },
          { label: dict.account.wishlist, value: String(summary?.wishlistCount ?? 0) },
        ].map((tile) => (
          <div key={tile.label} className="rounded-tile border border-line px-5 py-4">
            <p className="text-[11.5px] text-ink-soft">{tile.label}</p>
            <p className="mt-1 text-[20px] font-semibold text-ink-strong">{tile.value}</p>
          </div>
        ))}
      </section>

      {nextGrade && (
        <section className="rounded-tile border border-line px-5 py-4">
          <div className="flex items-center justify-between text-[12.5px]">
            <span className="text-ink-muted">{dict.account.nextGrade}</span>
            <span className="font-medium text-ink">
              {formatPrice(Math.max(0, nextGrade.minSpend - (summary?.totalSpend ?? 0)))}
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-pill bg-surface-sunk">
            <div className="h-full rounded-pill bg-brand transition-all duration-base" style={{ width: `${progress}%` }} />
          </div>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[14px] font-semibold text-ink-strong">{dict.account.orders}</h2>
          <Link href={localePath(locale, '/account/orders')} className="text-[12px] text-ink-muted hover:text-brand">
            {dict.common.seeAll}
          </Link>
        </div>

        {orders.data && orders.data.items.length > 0 ? (
          <ul className="flex flex-col divide-y divide-line-soft rounded-tile border border-line">
            {orders.data.items.slice(0, 4).map((order) => (
              <li key={order.id}>
                <Link
                  href={localePath(locale, `/account/orders/${order.code}`)}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition-colors duration-fast hover:bg-surface-soft"
                >
                  <span className="min-w-0">
                    <span className="block font-display text-[13px] font-semibold text-ink-strong">{order.code}</span>
                    <span className="block text-[11.5px] text-ink-soft">{formatDate(order.createdAt, locale)}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
                    <span className="text-[13px] font-medium">{formatPrice(order.total)}</span>
                    <OrderStatusBadge status={order.status} dict={dict} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title={dict.account.noOrders} />
        )}
      </section>
    </div>
  );
}

/* --------------------------------- orders -------------------------------- */

export function OrdersPanel({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMyOrders(page);

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!data || data.items.length === 0) return <EmptyState title={dict.account.noOrders} />;

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-3">
        {data.items.map((order) => (
          <li key={order.id} className="rounded-tile border border-line p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Link
                  href={localePath(locale, `/account/orders/${order.code}`)}
                  className="font-display text-[14px] font-semibold text-ink-strong hover:text-brand"
                >
                  {order.code}
                </Link>
                <p className="text-[11.5px] text-ink-soft">{formatDate(order.createdAt, locale, true)}</p>
              </div>
              <div className="flex items-center gap-2">
                <PaymentStatusBadge status={order.paymentStatus} dict={dict} />
                <OrderStatusBadge status={order.status} dict={dict} />
              </div>
            </div>

            <ul className="mt-4 flex flex-col gap-1.5 text-[12.5px]">
              {order.items.slice(0, 3).map((item, index) => (
                <li key={`${item.sku}-${index}`} className="flex justify-between gap-3">
                  <span className="min-w-0 flex-1 truncate text-ink-muted">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="shrink-0">{formatPrice(item.lineTotal)}</span>
                </li>
              ))}
              {order.items.length > 3 && (
                <li className="text-[11.5px] text-ink-faint">+{order.items.length - 3}</li>
              )}
            </ul>

            <div className="mt-4 flex items-center justify-between border-t border-line-soft pt-3">
              <span className="text-[12px] text-ink-muted">{dict.account.orderTotal}</span>
              <span className="text-[15px] font-semibold text-ink-strong">{formatPrice(order.total)}</span>
            </div>
          </li>
        ))}
      </ul>

      <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} onChange={setPage} />
    </div>
  );
}

export function OrderDetailPanel({ code, locale, dict }: { code: string; locale: Locale; dict: Dictionary }) {
  const { data: order, isLoading } = useQuery({
    queryKey: qk.myOrder(code),
    queryFn: () => orderApi.detail(code),
  });
  const cancel = useCancelOrder();
  const [confirm, setConfirm] = useState(false);

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (!order) return <EmptyState title={dict.common.error} />;

  const cancellable = ['pending', 'confirmed', 'preparing'].includes(order.status);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-[20px] font-bold tracking-wide text-ink-strong">{order.code}</h1>
          <p className="text-[12px] text-ink-soft">{formatDate(order.createdAt, locale, true)}</p>
        </div>
        <div className="flex items-center gap-2">
          <PaymentStatusBadge status={order.paymentStatus} dict={dict} />
          <OrderStatusBadge status={order.status} dict={dict} />
        </div>
      </header>

      <section className="rounded-tile border border-line p-5">
        <h2 className="mb-4 text-[13px] font-semibold text-ink-strong">{dict.account.orderStatus}</h2>
        <OrderTimeline order={order} dict={dict} locale={locale} />
      </section>

      <section className="rounded-tile border border-line p-5">
        <h2 className="mb-4 text-[13px] font-semibold text-ink-strong">{dict.cart.item}</h2>
        <ul className="flex flex-col divide-y divide-line-soft">
          {order.items.map((item, index) => (
            <li key={`${item.sku}-${index}`} className="flex gap-4 py-3 first:pt-0 last:pb-0">
              {item.thumbnail && (
                <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-card bg-surface-soft">
                  <Image src={item.thumbnail} alt={item.name} fill sizes="64px" className="object-cover" />
                </span>
              )}
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[13px] text-ink">{item.name}</span>
                <span className="text-[11.5px] text-ink-soft">× {item.quantity}</span>
                {item.options
                  .filter((option) => option.value && option.groupKey !== 'delivery_method')
                  .map((option) => (
                    <span key={option.groupKey} className="text-[11px] text-ink-faint">
                      {option.groupLabel}: {option.value}
                    </span>
                  ))}
              </span>
              <span className="shrink-0 text-[13px] font-medium">{formatPrice(item.lineTotal)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-tile border border-line p-5">
          <h2 className="mb-3 text-[13px] font-semibold text-ink-strong">{dict.checkout.deliveryInfo}</h2>
          <dl className="flex flex-col gap-1.5 text-[12.5px]">
            <Line label={dict.checkout.method} value={dict.delivery[order.delivery.method]} />
            <Line label={dict.checkout.recipientName} value={order.delivery.recipient} />
            <Line label={dict.checkout.phone} value={order.delivery.phone} />
            <Line
              label={dict.checkout.region}
              value={dict.regions[order.delivery.region as keyof Dictionary['regions']] ?? order.delivery.region}
            />
            <Line
              label={dict.checkout.street}
              value={`${order.delivery.city}, ${order.delivery.street} ${order.delivery.building ?? ''} ${order.delivery.apartment ?? ''}`}
            />
            <Line
              label={dict.checkout.deliveryDate}
              value={`${formatDate(order.delivery.requestedDate, locale)}${order.delivery.timeSlot ? ` · ${order.delivery.timeSlot}` : ''}`}
            />
          </dl>
        </div>

        <div className="rounded-tile border border-line p-5">
          <h2 className="mb-3 text-[13px] font-semibold text-ink-strong">{dict.checkout.orderSummary}</h2>
          <dl className="flex flex-col gap-1.5 text-[12.5px]">
            <Line label={dict.cart.subtotal} value={formatPrice(order.subtotal + order.optionsTotal)} />
            {order.gradeDiscount > 0 && (
              <Line label={dict.cart.gradeDiscount} value={`- ${formatPrice(order.gradeDiscount)}`} />
            )}
            <Line label={dict.cart.deliveryFee} value={formatPrice(order.deliveryFee)} />
            {order.pointsUsed > 0 && (
              <Line label={dict.checkout.usePoints} value={`- ${formatPrice(order.pointsUsed)}`} />
            )}
          </dl>
          <div className="mt-3 flex items-baseline justify-between border-t border-line-soft pt-3">
            <span className="text-[12.5px] text-ink-muted">{dict.cart.total}</span>
            <span className="font-display text-[20px] font-bold text-ink-strong">{formatPrice(order.total)}</span>
          </div>
          <p className="mt-2 text-[11.5px] text-ink-faint">{dict.checkout.cashOnDelivery}</p>
        </div>
      </section>

      {cancellable && (
        <div>
          <Button variant="outline" size="md" onClick={() => setConfirm(true)}>
            {dict.account.cancelOrder}
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={confirm}
        title={dict.account.cancelOrder}
        message={dict.account.cancelConfirm}
        confirmLabel={dict.common.confirm}
        cancelLabel={dict.common.cancel}
        tone="danger"
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          cancel.mutate({ code: order.code });
          setConfirm(false);
        }}
      />
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="shrink-0 text-ink-muted">{label}</dt>
      <dd className="text-right text-ink">{value}</dd>
    </div>
  );
}

/* -------------------------------- addresses ------------------------------- */

const EMPTY_ADDRESS: AddressBody = {
  label: '',
  recipient: '',
  phone: '',
  region: 'yerevan',
  city: '',
  street: '',
  building: '',
  apartment: '',
  postalCode: '',
  notes: '',
  isDefault: false,
};

export function AddressesPanel({ dict }: { dict: Dictionary }) {
  const { data: addresses, isLoading } = useAddresses();
  const { data: config } = useAppConfig();
  const save = useSaveAddress();
  const remove = useDeleteAddress();

  const [editing, setEditing] = useState<Address | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<AddressBody>(EMPTY_ADDRESS);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_ADDRESS);
    setOpen(true);
  };

  const openEdit = (address: Address) => {
    setEditing(address);
    const { id, ...rest } = address;
    setForm(rest);
    setOpen(true);
  };

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button size="md" onClick={openNew}>
          {dict.account.addAddress}
        </Button>
      </div>

      {addresses && addresses.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {addresses.map((address) => (
            <li key={address.id} className="rounded-tile border border-line p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-ink">
                    {address.label || address.recipient}
                    {address.isDefault && (
                      <span className="ml-2 rounded-pill bg-brand-50 px-2 py-0.5 text-[10px] text-brand-700">
                        {dict.account.defaultAddress}
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-[12px] text-ink-soft">{address.phone}</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-ink-muted">
                    {dict.regions[address.region as keyof Dictionary['regions']] ?? address.region}, {address.city},{' '}
                    {address.street} {address.building} {address.apartment}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => remove.mutate(address.id)}
                  aria-label={dict.common.delete}
                  className="shrink-0 text-ink-faint hover:text-danger-soft"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => openEdit(address)}
                className="mt-3 text-[12px] text-brand underline underline-offset-2"
              >
                {dict.common.edit}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title={dict.account.noAddresses} />
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? dict.common.edit : dict.account.addAddress}
        footer={
          <div className="flex gap-2">
            <Button variant="outline" size="lg" fullWidth onClick={() => setOpen(false)}>
              {dict.common.cancel}
            </Button>
            <Button
              size="lg"
              fullWidth
              loading={save.isPending}
              onClick={async () => {
                await save.mutateAsync({ id: editing?.id, body: form });
                setOpen(false);
              }}
            >
              {dict.common.save}
            </Button>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="addr-label"
            label={dict.account.addresses}
            value={form.label ?? ''}
            onChange={(event) => setForm((s) => ({ ...s, label: event.target.value }))}
          />
          <Input
            id="addr-recipient"
            label={dict.checkout.recipientName}
            required
            value={form.recipient}
            onChange={(event) => setForm((s) => ({ ...s, recipient: event.target.value }))}
          />
          <Input
            id="addr-phone"
            label={dict.checkout.phone}
            required
            value={form.phone}
            onChange={(event) => setForm((s) => ({ ...s, phone: event.target.value }))}
          />
          <Select
            id="addr-region"
            label={dict.checkout.region}
            required
            value={form.region}
            onChange={(event) => setForm((s) => ({ ...s, region: event.target.value }))}
          >
            {(config?.regions ?? []).map((region) => (
              <option key={region.key} value={region.key}>
                {dict.regions[region.key as keyof Dictionary['regions']] ?? region.key}
              </option>
            ))}
          </Select>
          <Input
            id="addr-city"
            label={dict.checkout.city}
            required
            value={form.city}
            onChange={(event) => setForm((s) => ({ ...s, city: event.target.value }))}
          />
          <Input
            id="addr-street"
            label={dict.checkout.street}
            required
            value={form.street}
            onChange={(event) => setForm((s) => ({ ...s, street: event.target.value }))}
          />
          <Input
            id="addr-building"
            label={dict.checkout.building}
            value={form.building ?? ''}
            onChange={(event) => setForm((s) => ({ ...s, building: event.target.value }))}
          />
          <Input
            id="addr-apartment"
            label={dict.checkout.apartment}
            value={form.apartment ?? ''}
            onChange={(event) => setForm((s) => ({ ...s, apartment: event.target.value }))}
          />
          <Textarea
            id="addr-notes"
            label={dict.checkout.notes}
            wrapperClassName="sm:col-span-2"
            value={form.notes ?? ''}
            onChange={(event) => setForm((s) => ({ ...s, notes: event.target.value }))}
          />
          <Checkbox
            className="sm:col-span-2"
            checked={form.isDefault}
            onChange={(event) => setForm((s) => ({ ...s, isDefault: event.target.checked }))}
            label={dict.account.setDefault}
          />
        </div>
      </Modal>
    </div>
  );
}

/* -------------------------------- wishlist -------------------------------- */

export function WishlistPanel({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const { data, isLoading } = useWishlist();
  const toggle = useToggleWishlist();

  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (!data || data.length === 0) return <EmptyState title={dict.common.empty} />;

  return (
    <ul className="grid grid-cols-2 gap-4 lg:grid-cols-3">
      {data.map((product) => (
        <li key={product.id} className="group relative">
          <Link href={localePath(locale, `/product/${product.slug}`)}>
            <span className="relative block aspect-square overflow-hidden rounded-tile bg-surface-soft">
              {product.thumbnail && (
                <Image
                  src={product.thumbnail}
                  alt={pickLocalized(product.name, locale)}
                  fill
                  sizes="240px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
            </span>
            <span className="mt-2 block line-clamp-2 text-[12.5px] text-ink">
              {pickLocalized(product.name, locale)}
            </span>
            <span className="mt-1 block text-[13px] font-semibold text-ink-strong">{formatPrice(product.price)}</span>
          </Link>

          <button
            type="button"
            onClick={() => toggle.mutate(product.id)}
            aria-label={dict.product.wishlistRemoved}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-brand shadow-card"
          >
            <HeartIcon className="h-4 w-4" filled />
          </button>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------- inquiries -------------------------------- */

export function InquiriesPanel({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: qk.myInquiries(page),
    queryFn: () => catalogApi.myInquiries({ page }),
  });

  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (!data || data.items.length === 0) return <EmptyState title={dict.product.noInquiries} />;

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col divide-y divide-line-soft rounded-tile border border-line">
        {data.items.map((inquiry) => (
          <li key={inquiry.id} className="px-5 py-4">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={cn(
                  'rounded-pill px-2 py-0.5 text-[10px]',
                  inquiry.status === 'answered' ? 'bg-brand-50 text-brand-700' : 'bg-surface-soft text-ink-soft',
                )}
              >
                {inquiry.status === 'answered' ? dict.product.answered : dict.product.open}
              </span>
              <span className="text-[11.5px] text-ink-faint">{formatDate(inquiry.createdAt, locale)}</span>
            </div>
            <p className="mt-2 text-[13px] font-medium text-ink">{inquiry.subject}</p>
            <p className="mt-1 whitespace-pre-line text-[12.5px] leading-relaxed text-ink-muted">{inquiry.body}</p>
            {inquiry.answer && (
              <div className="mt-3 rounded-card border-l-2 border-brand bg-surface-soft px-4 py-3 text-[12.5px] leading-relaxed text-ink-muted">
                {inquiry.answer.body}
              </div>
            )}
          </li>
        ))}
      </ul>
      <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} onChange={setPage} />
    </div>
  );
}

/* ----------------------------- subscriptions ------------------------------ */

export function SubscriptionsPanel({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const { data, isLoading } = useSubscriptions();
  const client = useQueryClient();
  const notify = useUiStore((s) => s.notify);
  const showApiError = useApiError();

  const change = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'pause' | 'resume' | 'cancel' }) =>
      accountApi.setSubscriptionStatus(id, action),
    onSuccess: () => client.invalidateQueries({ queryKey: qk.subscriptions }),
    onError: (error: Error) => showApiError(error),
  });

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title={dict.common.empty}
        action={
          <ButtonLink href={localePath(locale, '/subscription')} size="lg" className="mt-2">
            {dict.subscription.subscribe}
          </ButtonLink>
        }
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {data.map((subscription) => (
        <li key={subscription.id} className="rounded-tile border border-line p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[13px] font-medium text-ink">
                {typeof subscription.plan === 'object' ? pickLocalized(subscription.plan.name, locale) : ''}
              </p>
              <p className="text-[11.5px] text-ink-soft">{dict.subscription[subscription.cycle]}</p>
            </div>
            <span
              className={cn(
                'rounded-pill px-2.5 py-1 text-[11px]',
                subscription.status === 'active'
                  ? 'bg-brand-50 text-brand-700'
                  : subscription.status === 'paused'
                    ? 'bg-gold-wash text-ink'
                    : 'bg-surface-soft text-ink-soft',
              )}
            >
              {dict.subscription[subscription.status]}
            </span>
          </div>

          <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[12px]">
            <div className="flex gap-1.5">
              <dt className="text-ink-muted">{dict.subscription.nextDelivery}</dt>
              <dd>{formatDate(subscription.nextDeliveryAt, locale)}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="text-ink-muted">{dict.subscription.perDelivery}</dt>
              <dd>{formatPrice(subscription.pricePerDelivery)}</dd>
            </div>
          </dl>

          {subscription.status !== 'cancelled' && (
            <div className="mt-4 flex gap-2">
              {subscription.status === 'active' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => change.mutate({ id: subscription.id, action: 'pause' })}
                >
                  {dict.subscription.pause}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => change.mutate({ id: subscription.id, action: 'resume' })}
                >
                  {dict.subscription.resume}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => change.mutate({ id: subscription.id, action: 'cancel' })}
              >
                {dict.subscription.cancel}
              </Button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

/* -------------------------------- profile --------------------------------- */

export function ProfilePanel({ dict }: { dict: Dictionary }) {
  const { user } = useSession();
  const setUser = useAuthStore((s) => s.setUser);
  const notify = useUiStore((s) => s.notify);
  const showApiError = useApiError();

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [marketingOptIn, setMarketing] = useState(user?.marketingOptIn ?? false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const profile = useMutation({
    mutationFn: () => authApi.updateProfile({ name, phone, marketingOptIn }),
    onSuccess: (updated) => {
      setUser(updated);
      notify(dict.common.save, 'success');
    },
    onError: (error: Error) => showApiError(error),
  });

  const password = useMutation({
    mutationFn: () => authApi.changePassword({ currentPassword, newPassword, confirmPassword }),
    onSuccess: () => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      notify(dict.common.save, 'success');
    },
    onError: (error: Error) => showApiError(error),
  });

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-tile border border-line p-5">
        <h2 className="mb-4 text-[14px] font-semibold text-ink-strong">{dict.account.profile}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input id="profile-name" label={dict.auth.name} value={name} onChange={(e) => setName(e.target.value)} />
          <Input id="profile-phone" label={dict.auth.phone} value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Input id="profile-email" label={dict.auth.email} value={user?.email ?? ''} disabled />
        </div>
        <Checkbox
          className="mt-4"
          checked={marketingOptIn}
          onChange={(event) => setMarketing(event.target.checked)}
          label={dict.auth.marketingOptIn}
        />
        <Button className="mt-4" size="lg" loading={profile.isPending} onClick={() => profile.mutate()}>
          {dict.common.save}
        </Button>
      </section>

      <section className="rounded-tile border border-line p-5">
        <h2 className="mb-4 text-[14px] font-semibold text-ink-strong">{dict.auth.changePassword}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="pw-current"
            type="password"
            label={dict.auth.currentPassword}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <div className="hidden sm:block" />
          <Input
            id="pw-new"
            type="password"
            label={dict.auth.newPassword}
            hint={dict.validation.passwordRules}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Input
            id="pw-confirm"
            type="password"
            label={dict.auth.confirmPassword}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        <Button
          className="mt-4"
          size="lg"
          variant="outline"
          loading={password.isPending}
          onClick={() => password.mutate()}
        >
          {dict.auth.changePassword}
        </Button>
      </section>
    </div>
  );
}
