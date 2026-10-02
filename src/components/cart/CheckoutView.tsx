'use client';

import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { cn, formatPrice, todayIso } from '@/lib/utils';
import { localePath, type Dictionary, type Locale } from '@/lib/i18n';
import { communitiesFor } from '@/lib/communities';
import { ApiClientError } from '@/lib/api/client';
import { getLocalizedApiError, getLocalizedFieldError } from '@/lib/api/errors';
import { deliveryApi, orderApi, paymentApi, type CheckoutBody } from '@/lib/api/commerce';
import { qk } from '@/lib/queryKeys';
import { useApiError } from '@/lib/hooks/useApiError';
import { useCart } from '@/lib/hooks/useCart';
import { useAddresses } from '@/lib/hooks/useAccount';
import { useAppConfig, useDeliveryOptions } from '@/lib/hooks/useCatalog';
import { useSession } from '@/lib/hooks/useAuth';
import { redirectToProvider, savePendingPayment } from '@/lib/paymentFlow';
import { useCheckoutStore, type CheckoutDraft } from '@/store/checkout';
import { useUiStore } from '@/store/ui';
import { Button } from '@/components/ui/Button';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/Input';
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
  'delivery.region': 'region',
  'delivery.city': 'city',
  'delivery.street': 'street',
  'delivery.requestedDate': 'requested-date',
  'delivery.timeSlot': 'time-slot',
};

const PAYMENT_METHODS: PaymentMethod[] = ['cash_on_delivery', 'idram', 'arca'];

const ARMENIA_DIAL_CODE = '374';

/** Subscriber mask: "+374" comes from the flag prefix, the user types 8 more digits. */
const PHONE_MASKS = { am: '.. ... ...' };

/** Digits-only value the input and the stored draft share; Armenia assumed for local input. */
const normalizePhone = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').replace(/^0+/, '');
  if (!digits) return '';
  if (digits.startsWith(ARMENIA_DIAL_CODE)) return digits;
  return digits.length < 10 ? `${ARMENIA_DIAL_CODE}${digits}` : digits;
};

/** Clean E.164 value for the backend; unparseable legacy values stay as typed. */
const toBackendPhone = (raw: string): string => {
  const digits = normalizePhone(raw);
  return digits ? `+${digits}` : raw.trim();
};

const PHONE_INPUT_CLASS =
  '!h-11 !w-full !rounded-card !border !border-line !bg-white !pl-12 !pr-3 !text-[13px] !text-ink font-[inherit] ' +
  'focus:!border-brand focus:!shadow-none';
const PHONE_BUTTON_CLASS = '!rounded-l-card !border-0 !bg-transparent';

interface PendingPayment {
  token: string;
  orderCode: string;
  provider: CheckoutPayment['provider'];
  message: string;
}

/**
 * Checkout mirrors the reference order form: buyer block, recipient block,
 * delivery block, payment method and the summary. It is the only place customer,
 * recipient and delivery details are collected; validation is app-level and
 * localized, and online payments leave through the provider-hosted page.
 */
export function CheckoutView({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const router = useRouter();
  const client = useQueryClient();
  const { data: cart, isLoading } = useCart();
  const { data: config } = useAppConfig();
  const { data: deliveryOptions } = useDeliveryOptions();
  const { data: addresses } = useAddresses();
  const { user, isAuthenticated } = useSession();
  const notify = useUiStore((s) => s.notify);
  const showApiError = useApiError();

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
  const cityOptions = communitiesFor(draft.region);

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

  // Drafts persisted (or autofilled) with a city outside the selected region's list
  // must not survive: the select would show an option that is not rendered.
  useEffect(() => {
    if (!draft.city) return;
    if (!communitiesFor(draft.region).some((community) => community.value === draft.city)) update({ city: '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.region, draft.city]);

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
      void client.invalidateQueries({ queryKey: qk.cart });
      if (!payment) {
        reset();
        router.push(localePath(locale, `/order/complete/${order.code}`));
        return;
      }
      void beginPayment({ token: payment.returnToken, orderCode: order.code, provider: payment.provider });
    },
    onError: (error: Error) => {
      if (error instanceof ApiClientError && error.errors && Object.keys(error.errors).length > 0) {
        const local = validate();
        const mapped: Record<string, string> = {};
        for (const [key, messages] of Object.entries(error.errors)) {
          mapped[key] = local[key] ?? getLocalizedFieldError(messages[0], locale);
        }
        setErrors(mapped);
        notify(dict.checkout.requiredFieldsToast, 'error');
        focusFirstError(mapped);
        return;
      }
      showApiError(error);
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

  /** Same rule as the submit-time check, in localized form; undefined when acceptable. */
  const phoneError = (raw: string): string | undefined => {
    const digits = normalizePhone(raw);
    if (!digits) return dict.validation.phoneRequired;
    if (digits.length < 6) return dict.validation.phone;
    return undefined;
  };

  const handlePhone = (errorKey: string, store: (value: string) => void, raw: string) => {
    const digits = normalizePhone(raw);
    // The library reports the bare dial code while the field is empty: treat it as "cleared".
    const value = digits === ARMENIA_DIAL_CODE ? '' : digits;
    store(value);
    setErrors((prev) => {
      const message = value ? phoneError(value) : undefined;
      if (message) return { ...prev, [errorKey]: message };
      if (!(errorKey in prev)) return prev;
      const next = { ...prev };
      delete next[errorKey];
      return next;
    });
  };

  /** Switching regions invalidates the community: reset it and drop both errors. */
  const changeRegion = (region: string) => {
    update({ region, city: '' });
    setErrors((prev) => {
      if (!('delivery.region' in prev) && !('delivery.city' in prev)) return prev;
      const next = { ...prev };
      delete next['delivery.region'];
      delete next['delivery.city'];
      return next;
    });
  };

  const validate = (): Record<string, string> => {
    const next: Record<string, string> = {};
    if (draft.customerName.trim().length < 2) next['customer.name'] = dict.validation.required;

    const email = draft.customerEmail.trim();
    if (!email) next['customer.email'] = dict.validation.emailRequired;
    else if (!EMAIL_RE.test(email)) next['customer.email'] = dict.validation.email;

    const customerPhoneError = phoneError(draft.customerPhone);
    if (customerPhoneError) next['customer.phone'] = customerPhoneError;

    if (draft.recipient.trim().length < 2) next['delivery.recipient'] = dict.validation.required;

    const recipientPhoneError = phoneError(draft.recipientPhone);
    if (recipientPhoneError) next['delivery.phone'] = recipientPhoneError;

    if (!draft.region) next['delivery.region'] = dict.validation.required;
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
      const message = getLocalizedApiError(error, locale);
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
      customer: { name: draft.customerName, email: draft.customerEmail, phone: toBackendPhone(draft.customerPhone) },
      delivery: {
        method: draft.method,
        recipient: draft.recipient,
        phone: toBackendPhone(draft.recipientPhone),
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
            <Field
              label={dict.checkout.phone}
              required
              htmlFor="customer-phone"
              error={errors['customer.phone']}
            >
              <PhoneInput
                country="am"
                masks={PHONE_MASKS}
                value={normalizePhone(draft.customerPhone)}
                placeholder="+374 XX XXX XXX"
                containerClass="w-full"
                inputClass={PHONE_INPUT_CLASS}
                buttonClass={PHONE_BUTTON_CLASS}
                onChange={(value) => handlePhone('customer.phone', (v) => update({ customerPhone: v }), value)}
                inputProps={{
                  id: 'customer-phone',
                  name: 'customer-phone',
                  autoComplete: 'tel',
                  'aria-required': true,
                  'aria-invalid': Boolean(errors['customer.phone']),
                  'aria-describedby': errors['customer.phone'] ? 'customer-phone-error' : undefined,
                }}
              />
            </Field>
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
            <Field
              label={dict.checkout.recipientPhone}
              required
              htmlFor="recipient-phone"
              error={errors['delivery.phone']}
            >
              <PhoneInput
                country="am"
                masks={PHONE_MASKS}
                value={normalizePhone(draft.recipientPhone)}
                placeholder="+374 XX XXX XXX"
                containerClass="w-full"
                inputClass={PHONE_INPUT_CLASS}
                buttonClass={PHONE_BUTTON_CLASS}
                onChange={(value) => handlePhone('delivery.phone', (v) => update({ recipientPhone: v }), value)}
                inputProps={{
                  id: 'recipient-phone',
                  name: 'recipient-phone',
                  autoComplete: 'tel',
                  'aria-required': true,
                  'aria-invalid': Boolean(errors['delivery.phone']),
                  'aria-describedby': errors['delivery.phone'] ? 'recipient-phone-error' : undefined,
                }}
              />
            </Field>
            <Select
              id="region"
              label={dict.checkout.region}
              required
              value={draft.region}
              error={errors['delivery.region']}
              onChange={(event) => changeRegion(event.target.value)}
            >
              <option value="">{dict.checkout.selectRegion}</option>
              {regions.map((region) => (
                <option key={region.key} value={region.key}>
                  {dict.regions[region.key as keyof Dictionary['regions']] ?? region.key}
                </option>
              ))}
            </Select>
            <Select
              id="city"
              label={dict.checkout.city}
              required
              disabled={!draft.region}
              value={draft.city}
              error={errors['delivery.city']}
              onChange={(event) => updateField('delivery.city', { city: event.target.value })}
            >
              <option value="">{draft.region ? dict.checkout.selectCity : dict.checkout.selectRegion}</option>
              {cityOptions.map((community) => (
                <option key={community.value} value={community.value}>
                  {community[locale]}
                </option>
              ))}
            </Select>
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
