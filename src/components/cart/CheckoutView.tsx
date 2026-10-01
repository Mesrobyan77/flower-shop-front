'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { cn, dateKey, formatPrice, todayIso } from '@/lib/utils';
import { localePath, type Dictionary, type Locale } from '@/lib/i18n';
import { ApiClientError } from '@/lib/api/client';
import { deliveryApi, orderApi, paymentApi, type CheckoutBody } from '@/lib/api/commerce';
import { qk } from '@/lib/queryKeys';
import { useCart } from '@/lib/hooks/useCart';
import { useAddresses } from '@/lib/hooks/useAccount';
import { useAppConfig, useDeliveryOptions } from '@/lib/hooks/useCatalog';
import { useSession } from '@/lib/hooks/useAuth';
import { redirectToProvider, savePendingPayment } from '@/lib/paymentFlow';
import { useCheckoutStore, type CheckoutDraft } from '@/store/checkout';
import { useUiStore } from '@/store/ui';
import { Button } from '@/components/ui/Button';
import { Checkbox, Input, Select, Textarea } from '@/components/ui/Input';
import { EmptyState, Skeleton } from '@/components/ui/Feedback';
import { ButtonLink } from '@/components/ui/Button';
import type { CheckoutPayment, DeliveryMethod, PaymentMethod } from '@/types';

const EMAIL_RE = /^\S+@\S+\.\S+$/;

/** Maps schema field paths to the DOM ids so the first invalid input can take focus. */
const FIELD_IDS: Record<string, string> = {
  'customer.name': 'customer-name',
  'customer.email': 'customer-email',
  'customer.phone': 'customer-phone',
  'delivery.recipient': 'recipient',
  'delivery.phone': 'recipient-phone',
  'delivery.city': 'city',
  'delivery.street': 'street',
  'delivery.requestedDate': 'requested-date',
  'delivery.timeSlot': 'time-slot',
};

const PAYMENT_METHODS: PaymentMethod[] = ['cash_on_delivery', 'idram', 'arca'];

interface PendingPayment {
  token: string;
  orderCode: string;
  provider: CheckoutPayment['provider'];
  message: string;
}

/**
 * Checkout mirrors the reference order form: buyer block, recipient block,
 * delivery block, payment method and the summary. Delivery choices made on the
 * product page are prefilled and summarised here; validation is app-level and
 * localized, and online payments leave through the provider-hosted page.
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
  const [starting, setStarting] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(null);

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

  // Wait for the region config before enforcing: until it loads, `allowedMethods`
  // is only the fallback list and would clobber a persisted "quick" draft on refresh.
  useEffect(() => {
    if (!config) return;
    if (!allowedMethods.includes(draft.method)) update({ method: allowedMethods[0], timeSlot: '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, allowedMethods.join(',')]);

  /**
   * Phases 1: honour the delivery choices from the product page. The draft
   * wins whenever the user already touched a field (including on refresh,
   * because the draft is persisted), so prefill only fills blanks, once.
   * Waits for the region config so `allowedMethods` is the real list, not the
   * pre-load fallback that would drop the product-page delivery choices.
   */
  const prefilledRef = useRef(false);
  useEffect(() => {
    if (prefilledRef.current || !cart || cart.items.length === 0 || !deliveryOptions || !config) return;
    prefilledRef.current = true;

    const first = cart.items.find((item) => item.deliveryDate) ?? cart.items[0];
    if (!first) return;

    const patch: Partial<CheckoutDraft> = {};
    const itemMethod = first.deliveryMethod;
    const untouchedDelivery = !draft.requestedDate && !draft.timeSlot;
    if (untouchedDelivery && itemMethod !== draft.method && allowedMethods.includes(itemMethod)) {
      patch.method = itemMethod;
    }
    const effectiveMethod = patch.method ?? draft.method;
    const option = deliveryOptions?.methods.find((m) => m.method === effectiveMethod);
    const validDates = new Set(
      (option?.calendar ?? []).filter((day) => day.available && day.date >= todayIso()).map((day) => day.date),
    );
    const wantedDate = dateKey(first.deliveryDate);
    if (!draft.requestedDate && wantedDate && validDates.has(wantedDate)) {
      patch.requestedDate = wantedDate;
    }
    if (
      !draft.timeSlot &&
      first.timeSlot &&
      effectiveMethod === 'quick' &&
      (option?.timeSlots ?? []).includes(first.timeSlot)
    ) {
      patch.timeSlot = first.timeSlot;
    }
    if (Object.keys(patch).length > 0) update(patch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart, deliveryOptions, config]);

  /** Distinct delivery choices made on the product page, shown read-only. */
  const productDelivery = useMemo(() => {
    if (!cart) return [];
    const rows: { name: string; method: DeliveryMethod; date?: string; slot?: string }[] = [];
    const seen = new Set<string>();
    for (const item of cart.items) {
      const key = `${item.deliveryMethod}|${item.deliveryDate ?? ''}|${item.timeSlot ?? ''}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push({ name: item.product?.name ?? '', method: item.deliveryMethod, date: dateKey(item.deliveryDate) || undefined, slot: item.timeSlot });
    }
    return rows;
  }, [cart]);

  const methodOption = deliveryOptions?.methods.find((m) => m.method === draft.method);
  const timeSlots = methodOption?.timeSlots ?? [];
  const merchandise = cart ? cart.totals.merchandiseTotal - cart.totals.gradeDiscount : 0;

  const quote = useQuery({
    queryKey: qk.deliveryQuote(draft.method, draft.region, merchandise),
    queryFn: () => deliveryApi.quote({ method: draft.method, region: draft.region, subtotal: merchandise }),
    enabled: Boolean(draft.region && draft.method && cart),
  });

  const { data: paymentMethods } = useQuery({
    queryKey: qk.paymentMethods,
    queryFn: paymentApi.methods,
    staleTime: 5 * 60 * 1000,
  });

  const isPaymentEnabled = (method: PaymentMethod) => {
    if (method === 'cash_on_delivery') return true;
    const entry = paymentMethods?.find((item) => item.key === method);
    return entry ? entry.enabled : true;
  };

  useEffect(() => {
    if (!paymentMethods) return;
    if (draft.paymentMethod !== 'cash_on_delivery' && !isPaymentEnabled(draft.paymentMethod)) {
      update({ paymentMethod: 'cash_on_delivery' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentMethods, draft.paymentMethod]);

  const paymentLabel: Record<PaymentMethod, string> = {
    cash_on_delivery: dict.checkout.paymentCash,
    idram: dict.checkout.paymentIdram,
    arca: dict.checkout.paymentCard,
  };
  const paymentHint: Record<PaymentMethod, string> = {
    cash_on_delivery: dict.checkout.cashOnDeliveryHint,
    idram: dict.checkout.idramHint,
    arca: dict.checkout.cardHint,
  };

  const maxPoints = Math.min(user?.points ?? 0, merchandise);
  const deliveryTotal = quote.data?.total ?? 0;
  const payable = Math.max(0, merchandise + deliveryTotal - draft.pointsUsed);

  const checkout = useMutation({
    mutationFn: (body: CheckoutBody) => orderApi.checkout(body),
    onSuccess: ({ order, payment }) => {
      if (!payment) {
        reset();
        router.push(localePath(locale, `/order/complete/${order.code}`));
        return;
      }
      void beginPayment({ token: payment.returnToken, orderCode: order.code, provider: payment.provider });
    },
    onError: (error: Error) => {
      if (error instanceof ApiClientError && error.code === 'PROVIDER_UNAVAILABLE') {
        notify(dict.checkout.providerUnavailable, 'error');
        return;
      }
      if (error instanceof ApiClientError && error.errors && Object.keys(error.errors).length > 0) {
        const local = validate();
        const mapped: Record<string, string> = {};
        for (const [key, messages] of Object.entries(error.errors)) mapped[key] = local[key] ?? messages[0];
        setErrors(mapped);
        notify(dict.checkout.requiredFieldsToast, 'error');
        focusFirstError(mapped);
        return;
      }
      notify(dict.checkout.errorGeneric, 'error');
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

  const validate = (): Record<string, string> => {
    const next: Record<string, string> = {};
    if (draft.customerName.trim().length < 2) next['customer.name'] = dict.validation.required;

    const email = draft.customerEmail.trim();
    if (!email) next['customer.email'] = dict.validation.emailRequired;
    else if (!EMAIL_RE.test(email)) next['customer.email'] = dict.validation.email;

    const customerPhone = draft.customerPhone.trim();
    if (!customerPhone) next['customer.phone'] = dict.validation.phoneRequired;
    else if (customerPhone.length < 6) next['customer.phone'] = dict.validation.phone;

    if (draft.recipient.trim().length < 2) next['delivery.recipient'] = dict.validation.required;

    const recipientPhone = draft.recipientPhone.trim();
    if (!recipientPhone) next['delivery.phone'] = dict.validation.phoneRequired;
    else if (recipientPhone.length < 6) next['delivery.phone'] = dict.validation.phone;

    if (!draft.city.trim()) next['delivery.city'] = dict.validation.required;
    if (!draft.street.trim()) next['delivery.street'] = dict.validation.required;
    if (!draft.requestedDate) next['delivery.requestedDate'] = dict.validation.deliveryDateRequired;
    if (draft.method === 'quick' && timeSlots.length > 0 && !draft.timeSlot) {
      next['delivery.timeSlot'] = dict.validation.deliveryTimeRequired;
    }
    if (!isPaymentEnabled(draft.paymentMethod)) next['payment.method'] = dict.checkout.providerUnavailable;
    return next;
  };

  const focusFirstError = (fieldErrors: Record<string, string>) => {
    const key = Object.keys(FIELD_IDS).find((field) => fieldErrors[field]);
    if (!key) return;
    const element = document.getElementById(FIELD_IDS[key]);
    if (!element) return;
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element.focus({ preventScroll: true });
  };

  const updateField = (key: string, patch: Partial<CheckoutDraft>) => {
    update(patch);
    setErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  /** Creates (or reuses) the payment session and leaves for the provider page. */
  const beginPayment = async (hint: { token: string; orderCode: string; provider: CheckoutPayment['provider'] }) => {
    setStarting(true);
    setPendingPayment({ ...hint, message: '' });
    savePendingPayment(hint);
    let navigating = false;
    try {
      const result = await paymentApi.start({ token: hint.token, locale });
      if (result.kind === 'form' || result.kind === 'url') {
        navigating = true;
        redirectToProvider(result);
        return;
      }
      reset();
      router.push(`${localePath(locale, '/checkout/payment/return')}?token=${encodeURIComponent(hint.token)}`);
    } catch (error) {
      const message =
        error instanceof ApiClientError && error.code === 'PROVIDER_UNAVAILABLE'
          ? dict.checkout.providerUnavailable
          : dict.checkout.paymentNotStarted;
      setPendingPayment({ ...hint, message });
      notify(message, 'error');
    } finally {
      if (!navigating) setStarting(false);
    }
  };

  const submit = () => {
    if (checkout.isPending || starting) return;
    if (pendingPayment) {
      void beginPayment(pendingPayment);
      return;
    }
    if (!agree) {
      notify(dict.checkout.agreeTerms, 'error');
      return;
    }
    const next = validate();
    if (Object.keys(next).length > 0) {
      setErrors(next);
      notify(dict.checkout.requiredFieldsToast, 'error');
      focusFirstError(next);
      return;
    }
    setErrors({});
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
      paymentMethod: draft.paymentMethod,
    });
  };

  const placeOrderBusy = checkout.isPending || starting;

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10"
    >
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
              onChange={(event) => updateField('customer.name', { customerName: event.target.value })}
            />
            <Input
              id="customer-phone"
              label={dict.checkout.phone}
              required
              value={draft.customerPhone}
              error={errors['customer.phone']}
              onChange={(event) => updateField('customer.phone', { customerPhone: event.target.value })}
            />
            <Input
              id="customer-email"
              type="email"
              label={dict.checkout.email}
              required
              wrapperClassName="sm:col-span-2"
              value={draft.customerEmail}
              error={errors['customer.email']}
              onChange={(event) => updateField('customer.email', { customerEmail: event.target.value })}
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
              onChange={(event) => updateField('delivery.recipient', { recipient: event.target.value })}
            />
            <Input
              id="recipient-phone"
              label={dict.checkout.recipientPhone}
              required
              value={draft.recipientPhone}
              error={errors['delivery.phone']}
              onChange={(event) => updateField('delivery.phone', { recipientPhone: event.target.value })}
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
              onChange={(event) => updateField('delivery.city', { city: event.target.value })}
            />
            <Input
              id="street"
              label={dict.checkout.street}
              required
              wrapperClassName="sm:col-span-2"
              value={draft.street}
              error={errors['delivery.street']}
              onChange={(event) => updateField('delivery.street', { street: event.target.value })}
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

          {productDelivery.length > 0 && (
            <div className="mb-4 rounded-tile border border-line-soft bg-surface-soft/60 px-4 py-3">
              <p className="text-[12px] font-semibold text-ink-strong">{dict.checkout.selectedOnProduct}</p>
              <ul className="mt-2 flex flex-col gap-1 text-[11.5px] text-ink-muted">
                {productDelivery.map((row, index) => (
                  <li key={index} className="flex flex-wrap justify-between gap-x-3">
                    <span className="min-w-0 flex-1 truncate">{row.name}</span>
                    <span className="shrink-0">
                      {dict.delivery[row.method]}
                      {row.date ? ` · ${row.date}` : ''}
                      {row.slot ? ` · ${row.slot}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

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
              onChange={(event) => updateField('delivery.requestedDate', { requestedDate: event.target.value })}
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

            {draft.method === 'quick' && timeSlots.length > 0 && (
              <Select
                id="time-slot"
                label={dict.checkout.timeSlot}
                required
                value={draft.timeSlot}
                error={errors['delivery.timeSlot']}
                onChange={(event) => updateField('delivery.timeSlot', { timeSlot: event.target.value })}
              >
                <option value="">{dict.product.notSelected}</option>
                {timeSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </Select>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-[14px] font-semibold text-ink-strong">{dict.checkout.paymentMethod}</h2>
          <div className="grid gap-2 sm:grid-cols-3">
            {PAYMENT_METHODS.map((method) => {
              const enabled = isPaymentEnabled(method);
              return (
                <label
                  key={method}
                  className={cn(
                    'flex items-start gap-3 rounded-card border p-3 transition-colors duration-fast',
                    enabled ? 'cursor-pointer' : 'cursor-not-allowed opacity-60',
                    draft.paymentMethod === method ? 'border-brand bg-brand-50/50' : 'border-line',
                    enabled && draft.paymentMethod !== method && 'hover:border-line-strong',
                  )}
                >
                  <input
                    type="radio"
                    name="checkout-payment"
                    checked={draft.paymentMethod === method}
                    disabled={!enabled || Boolean(pendingPayment)}
                    onChange={() => update({ paymentMethod: method })}
                    className="mt-0.5 h-4 w-4 accent-brand"
                  />
                  <span className="flex-1">
                    <span className="block text-[13px] font-medium text-ink">{paymentLabel[method]}</span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-ink-soft">
                      {enabled ? paymentHint[method] : dict.checkout.paymentUnavailable}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
          {errors['payment.method'] && <p className="mt-2 text-[11px] text-danger-soft">{errors['payment.method']}</p>}

          <div className="mt-4 rounded-tile border border-brand bg-brand-50/40 px-5 py-4">
            <p className="text-[13px] font-medium text-brand-700">{paymentLabel[draft.paymentMethod]}</p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-ink-muted">{paymentHint[draft.paymentMethod]}</p>
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
              <Button type="button" variant="outline" size="md" onClick={() => update({ pointsUsed: maxPoints })}>
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

          {pendingPayment?.message && (
            <div className="mt-4 rounded-card border border-danger-soft/40 bg-danger-soft/5 px-4 py-3">
              <p className="text-[12px] leading-relaxed text-danger-soft">{pendingPayment.message}</p>
              <p className="mt-1 text-[11.5px] text-ink-muted">
                {dict.paymentReturn.orderLabel}: {pendingPayment.orderCode}
              </p>
            </div>
          )}

          <Checkbox
            className="mt-5"
            checked={agree}
            onChange={(event) => setAgree(event.target.checked)}
            label={dict.checkout.agreeTerms}
          />

          <Button
            type="submit"
            size="xl"
            fullWidth
            className="mt-4"
            loading={placeOrderBusy}
            disabled={placeOrderBusy}
          >
            {checkout.isPending
              ? dict.checkout.processing
              : starting
                ? dict.checkout.redirecting
                : pendingPayment
                  ? dict.checkout.retryPayment
                  : dict.checkout.placeOrder}
          </Button>
        </div>
      </aside>
    </form>
  );
}
