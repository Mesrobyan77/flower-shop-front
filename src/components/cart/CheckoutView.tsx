'use client';

import { useQuery } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { cn, formatPrice, todayIso } from '@/lib/utils';
import { localePath, type Dictionary, type Locale } from '@/lib/i18n';
import { ApiClientError } from '@/lib/api/client';
import { deliveryApi, orderApi, type CheckoutBody } from '@/lib/api/commerce';
import { qk } from '@/lib/queryKeys';
import { useCart } from '@/lib/hooks/useCart';
import { useAddresses } from '@/lib/hooks/useAccount';
import { useAppConfig, useDeliveryOptions } from '@/lib/hooks/useCatalog';
import { useSession } from '@/lib/hooks/useAuth';
import { useCheckoutStore } from '@/store/checkout';
import { useUiStore } from '@/store/ui';
import { Button } from '@/components/ui/Button';
import { Checkbox, Input, Select, Textarea } from '@/components/ui/Input';
import { EmptyState, Skeleton } from '@/components/ui/Feedback';
import { ButtonLink } from '@/components/ui/Button';
import type { DeliveryMethod } from '@/types';

/**
 * Checkout mirrors the reference order form: buyer block, recipient block,
 * delivery block, then the summary. Payment is cash on delivery, so there is no
 * gateway step and the confirm button writes the order directly.
 */
export function CheckoutView({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const router = useRouter();
  const { data: cart, isLoading } = useCart();
  const { data: config } = useAppConfig();
  const { data: deliveryOptions } = useDeliveryOptions();
  const { data: addresses } = useAddresses();
  const { user, isAuthenticated } = useSession();
  const notify = useUiStore((s) => s.notify);

  const { draft, update, reset } = useCheckoutStore();
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Prefill from the signed-in profile once, without clobbering typed input.
  useEffect(() => {
    if (!user) return;
    update({
      customerName: draft.customerName || user.name,
      customerEmail: draft.customerEmail || user.email,
      customerPhone: draft.customerPhone || user.phone || '',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const regions = config?.regions ?? [];
  const activeRegion = regions.find((r) => r.key === draft.region);

  const allowedMethods = useMemo<DeliveryMethod[]>(() => {
    if (!activeRegion) return ['parcel', 'pickup'];
    const methods: DeliveryMethod[] = [];
    if (activeRegion.quick) methods.push('quick');
    methods.push('parcel', 'pickup');
    return methods;
  }, [activeRegion]);

  useEffect(() => {
    if (!allowedMethods.includes(draft.method)) update({ method: allowedMethods[0], timeSlot: '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowedMethods.join(',')]);

  const methodOption = deliveryOptions?.methods.find((m) => m.method === draft.method);
  const merchandise = cart ? cart.totals.merchandiseTotal - cart.totals.gradeDiscount : 0;

  const quote = useQuery({
    queryKey: qk.deliveryQuote(draft.method, draft.region, merchandise),
    queryFn: () => deliveryApi.quote({ method: draft.method, region: draft.region, subtotal: merchandise }),
    enabled: Boolean(draft.region && draft.method && cart),
  });

  const maxPoints = Math.min(user?.points ?? 0, merchandise);
  const deliveryTotal = quote.data?.total ?? 0;
  const payable = Math.max(0, merchandise + deliveryTotal - draft.pointsUsed);

  const checkout = useMutation({
    mutationFn: (body: CheckoutBody) => orderApi.checkout(body),
    onSuccess: (order) => {
      reset();
      router.push(localePath(locale, `/order/complete/${order.code}`));
    },
    onError: (error: Error) => {
      if (error instanceof ApiClientError && error.errors) {
        const flat: Record<string, string> = {};
        for (const [key, messages] of Object.entries(error.errors)) flat[key] = messages[0];
        setErrors(flat);
      }
      notify(error.message, 'error');
    },
  });

  if (isLoading) return <Skeleton className="h-96 w-full" />;

  if (!cart || cart.items.length === 0) {
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

  const validate = () => {
    const next: Record<string, string> = {};
    if (draft.customerName.trim().length < 2) next['customer.name'] = dict.validation.required;
    if (!/^\S+@\S+\.\S+$/.test(draft.customerEmail)) next['customer.email'] = dict.validation.email;
    if (draft.customerPhone.trim().length < 6) next['customer.phone'] = dict.validation.phone;
    if (draft.recipient.trim().length < 2) next['delivery.recipient'] = dict.validation.required;
    if (draft.recipientPhone.trim().length < 6) next['delivery.phone'] = dict.validation.phone;
    if (!draft.city.trim()) next['delivery.city'] = dict.validation.required;
    if (!draft.street.trim()) next['delivery.street'] = dict.validation.required;
    if (!draft.requestedDate) next['delivery.requestedDate'] = dict.validation.required;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = () => {
    if (!agree) {
      notify(dict.checkout.agreeTerms, 'error');
      return;
    }
    if (!validate()) return;

    checkout.mutate({
      customer: { name: draft.customerName, email: draft.customerEmail, phone: draft.customerPhone },
      delivery: {
        method: draft.method,
        recipient: draft.recipient,
        phone: draft.recipientPhone,
        region: draft.region,
        city: draft.city,
        street: draft.street,
        building: draft.building || undefined,
        apartment: draft.apartment || undefined,
        postalCode: draft.postalCode || undefined,
        notes: draft.notes || undefined,
        requestedDate: draft.requestedDate,
        timeSlot: draft.method === 'quick' && draft.timeSlot ? draft.timeSlot : undefined,
      },
      customerNote: draft.customerNote || undefined,
      pointsUsed: draft.pointsUsed || 0,
      agreeTerms: true,
    });
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10">
      <div className="flex flex-col gap-8">
        {isAuthenticated && addresses && addresses.length > 0 && (
          <section>
            <h2 className="mb-3 text-[14px] font-semibold text-ink-strong">{dict.checkout.savedAddresses}</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {addresses.map((address) => (
                <button
                  key={address.id}
                  type="button"
                  onClick={() =>
                    update({
                      recipient: address.recipient,
                      recipientPhone: address.phone,
                      region: address.region,
                      city: address.city,
                      street: address.street,
                      building: address.building ?? '',
                      apartment: address.apartment ?? '',
                      postalCode: address.postalCode ?? '',
                      notes: address.notes ?? '',
                    })
                  }
                  className="rounded-card border border-line px-4 py-3 text-left transition-colors duration-fast hover:border-brand"
                >
                  <span className="block text-[12.5px] font-medium text-ink">
                    {address.label || address.recipient}
                    {address.isDefault && (
                      <span className="ml-2 rounded-pill bg-brand-50 px-2 py-0.5 text-[10px] text-brand-700">
                        {dict.account.defaultAddress}
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block text-[11.5px] text-ink-soft">
                    {dict.regions[address.region as keyof Dictionary['regions']] ?? address.region}, {address.city},{' '}
                    {address.street}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-4 text-[14px] font-semibold text-ink-strong">{dict.checkout.customer}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="customer-name"
              label={dict.checkout.name}
              required
              value={draft.customerName}
              error={errors['customer.name']}
              onChange={(event) => update({ customerName: event.target.value })}
            />
            <Input
              id="customer-phone"
              label={dict.checkout.phone}
              required
              value={draft.customerPhone}
              error={errors['customer.phone']}
              onChange={(event) => update({ customerPhone: event.target.value })}
            />
            <Input
              id="customer-email"
              type="email"
              label={dict.checkout.email}
              required
              wrapperClassName="sm:col-span-2"
              value={draft.customerEmail}
              error={errors['customer.email']}
              onChange={(event) => update({ customerEmail: event.target.value })}
            />
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-[14px] font-semibold text-ink-strong">{dict.checkout.recipient}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="recipient"
              label={dict.checkout.recipientName}
              required
              value={draft.recipient}
              error={errors['delivery.recipient']}
              onChange={(event) => update({ recipient: event.target.value })}
            />
            <Input
              id="recipient-phone"
              label={dict.checkout.recipientPhone}
              required
              value={draft.recipientPhone}
              error={errors['delivery.phone']}
              onChange={(event) => update({ recipientPhone: event.target.value })}
            />
            <Select
              id="region"
              label={dict.checkout.region}
              required
              value={draft.region}
              onChange={(event) => update({ region: event.target.value })}
            >
              {regions.map((region) => (
                <option key={region.key} value={region.key}>
                  {dict.regions[region.key as keyof Dictionary['regions']] ?? region.key}
                </option>
              ))}
            </Select>
            <Input
              id="city"
              label={dict.checkout.city}
              required
              value={draft.city}
              error={errors['delivery.city']}
              onChange={(event) => update({ city: event.target.value })}
            />
            <Input
              id="street"
              label={dict.checkout.street}
              required
              wrapperClassName="sm:col-span-2"
              value={draft.street}
              error={errors['delivery.street']}
              onChange={(event) => update({ street: event.target.value })}
            />
            <Input
              id="building"
              label={dict.checkout.building}
              value={draft.building}
              onChange={(event) => update({ building: event.target.value })}
            />
            <Input
              id="apartment"
              label={dict.checkout.apartment}
              value={draft.apartment}
              onChange={(event) => update({ apartment: event.target.value })}
            />
            <Textarea
              id="notes"
              label={dict.checkout.notes}
              wrapperClassName="sm:col-span-2"
              value={draft.notes}
              onChange={(event) => update({ notes: event.target.value })}
            />
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-[14px] font-semibold text-ink-strong">{dict.checkout.deliveryInfo}</h2>

          <div className="flex flex-col gap-2">
            {allowedMethods.map((method) => (
              <label
                key={method}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-card border p-3 transition-colors duration-fast',
                  draft.method === method ? 'border-brand bg-brand-50/50' : 'border-line hover:border-line-strong',
                )}
              >
                <input
                  type="radio"
                  name="checkout-method"
                  checked={draft.method === method}
                  onChange={() => update({ method, requestedDate: '', timeSlot: '' })}
                  className="mt-0.5 h-4 w-4 accent-brand"
                />
                <span className="flex-1">
                  <span className="block text-[13px] font-medium text-ink">{dict.delivery[method]}</span>
                  <span className="mt-0.5 block text-[11.5px] text-ink-soft">
                    {dict.delivery[`${method}Desc` as 'quickDesc']}
                  </span>
                </span>
              </label>
            ))}
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Select
              id="requested-date"
              label={dict.checkout.deliveryDate}
              required
              value={draft.requestedDate}
              error={errors['delivery.requestedDate']}
              onChange={(event) => update({ requestedDate: event.target.value })}
            >
              <option value="">{dict.product.notSelected}</option>
              {(methodOption?.calendar ?? [])
                .filter((day) => day.available && day.date >= todayIso())
                .map((day) => (
                  <option key={day.date} value={day.date}>
                    {day.date}
                  </option>
                ))}
            </Select>

            {draft.method === 'quick' && (
              <Select
                id="time-slot"
                label={dict.checkout.timeSlot}
                value={draft.timeSlot}
                onChange={(event) => update({ timeSlot: event.target.value })}
              >
                <option value="">{dict.product.notSelected}</option>
                {(methodOption?.timeSlots ?? []).map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </Select>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-[14px] font-semibold text-ink-strong">{dict.checkout.payment}</h2>
          <div className="rounded-tile border border-brand bg-brand-50/40 px-5 py-4">
            <p className="text-[13px] font-medium text-brand-700">{dict.checkout.cashOnDelivery}</p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-ink-muted">{dict.checkout.cashOnDeliveryHint}</p>
          </div>

          {isAuthenticated && maxPoints > 0 && (
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <Input
                id="points"
                type="number"
                min={0}
                max={maxPoints}
                label={dict.checkout.usePoints}
                hint={`${dict.checkout.availablePoints}: ${formatPrice(user?.points ?? 0)}`}
                value={draft.pointsUsed || ''}
                wrapperClassName="w-48"
                onChange={(event) =>
                  update({ pointsUsed: Math.max(0, Math.min(maxPoints, Number(event.target.value) || 0)) })
                }
              />
              <Button variant="outline" size="md" onClick={() => update({ pointsUsed: maxPoints })}>
                {dict.common.all}
              </Button>
            </div>
          )}

          <Textarea
            id="customer-note"
            label={dict.checkout.notes}
            wrapperClassName="mt-4"
            value={draft.customerNote}
            onChange={(event) => update({ customerNote: event.target.value })}
          />
        </section>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-tile border border-line p-5">
          <h2 className="text-[14px] font-semibold text-ink-strong">{dict.checkout.orderSummary}</h2>

          <ul className="mt-4 flex max-h-56 flex-col gap-3 overflow-y-auto pr-1">
            {cart.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-3 text-[12.5px]">
                <span className="min-w-0 flex-1 truncate text-ink-muted">
                  {item.product?.name} × {item.quantity}
                </span>
                <span className="shrink-0 text-ink">{formatPrice(item.lineTotal)}</span>
              </li>
            ))}
          </ul>

          <dl className="mt-4 flex flex-col gap-2.5 border-t border-line pt-4 text-[13px]">
            <div className="flex justify-between">
              <dt className="text-ink-muted">{dict.cart.subtotal}</dt>
              <dd>{formatPrice(cart.totals.merchandiseTotal)}</dd>
            </div>
            {cart.totals.gradeDiscount > 0 && (
              <div className="flex justify-between text-brand">
                <dt>{dict.cart.gradeDiscount}</dt>
                <dd>- {formatPrice(cart.totals.gradeDiscount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-ink-muted">{dict.cart.deliveryFee}</dt>
              <dd>{deliveryTotal === 0 ? dict.common.free : formatPrice(deliveryTotal)}</dd>
            </div>
            {draft.pointsUsed > 0 && (
              <div className="flex justify-between text-olive-dark">
                <dt>{dict.checkout.usePoints}</dt>
                <dd>- {formatPrice(draft.pointsUsed)}</dd>
              </div>
            )}
          </dl>

          <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
            <span className="text-[13px] text-ink-muted">{dict.cart.total}</span>
            <span className="font-display text-[24px] font-bold tracking-tight text-ink-strong">
              {formatPrice(payable)}
            </span>
          </div>

          {quote.data?.freeThreshold && !quote.data.isFree && draft.method === 'parcel' && (
            <p className="mt-2 text-[11.5px] text-ink-faint">
              {dict.delivery.freeOver} {formatPrice(quote.data.freeThreshold)}
            </p>
          )}

          <Checkbox
            className="mt-5"
            checked={agree}
            onChange={(event) => setAgree(event.target.checked)}
            label={dict.checkout.agreeTerms}
          />

          <Button
            size="xl"
            fullWidth
            className="mt-4"
            onClick={submit}
            loading={checkout.isPending}
            disabled={!agree || checkout.isPending}
          >
            {checkout.isPending ? dict.checkout.processing : dict.checkout.placeOrder}
          </Button>
        </div>
      </aside>
    </div>
  );
}
