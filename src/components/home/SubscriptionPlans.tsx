'use client';

import Image from 'next/image';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { cn, formatPrice } from '@/lib/utils';
import { localePath, pickLocalized, type Dictionary, type Locale } from '@/lib/i18n';
import { contentApi } from '@/lib/api/content';
import { accountApi } from '@/lib/api/account';
import { qk } from '@/lib/queryKeys';
import { useAppConfig } from '@/lib/hooks/useCatalog';
import { useApiError } from '@/lib/hooks/useApiError';
import { useSession } from '@/lib/hooks/useAuth';
import { useUiStore } from '@/store/ui';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Overlay';
import { Skeleton } from '@/components/ui/Feedback';
import type { SubscriptionPlan } from '@/types';

/**
 * Subscription landing block: plan cards plus the enrolment sheet. The reference
 * ran a long editorial page here; the commerce part is what actually matters.
 */
export function SubscriptionPlans({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const router = useRouter();
  const { isAuthenticated } = useSession();
  const { data: config } = useAppConfig();
  const notify = useUiStore((s) => s.notify);
  const showApiError = useApiError();

  const { data: plans, isLoading } = useQuery({ queryKey: qk.plans, queryFn: contentApi.plans });
  const [selected, setSelected] = useState<SubscriptionPlan | null>(null);

  const [form, setForm] = useState({
    recipient: '',
    phone: '',
    region: 'yerevan',
    city: '',
    street: '',
    building: '',
    apartment: '',
    notes: '',
  });

  const subscribe = useMutation({
    mutationFn: () =>
      accountApi.subscribe({
        planId: selected!.id,
        cycle: selected!.cycle,
        ...form,
      }),
    onSuccess: () => {
      setSelected(null);
      notify(dict.subscription.subscribe, 'success');
      router.push(localePath(locale, '/account/subscriptions'));
    },
    onError: (error: Error) => showApiError(error),
  });

  if (isLoading) return <Skeleton className="h-72 w-full" />;

  return (
    <>
      <div className="grid gap-5 lg:grid-cols-3">
        {(plans ?? []).map((plan) => (
          <article key={plan.id} className="flex flex-col overflow-hidden rounded-tile border border-line">
            <div className="relative aspect-[4/3] w-full bg-surface-soft">
              {plan.image && (
                <Image
                  src={plan.image}
                  alt={pickLocalized(plan.name, locale)}
                  fill
                  sizes="(max-width: 768px) 100vw, 400px"
                  className="object-cover"
                />
              )}
            </div>

            <div className="flex flex-1 flex-col p-5">
              <span className="text-[11px] uppercase tracking-[0.16em] text-olive-dark">
                {dict.subscription[plan.cycle]}
              </span>
              <h3 className="mt-1.5 text-[16px] font-semibold text-ink-strong">
                {pickLocalized(plan.name, locale)}
              </h3>
              <p className="mt-2 flex-1 text-[12.5px] leading-relaxed text-ink-muted">
                {pickLocalized(plan.description, locale)}
              </p>

              <p className="mt-4 flex items-baseline gap-1.5">
                <span className="font-display text-[22px] font-bold text-ink-strong">
                  {formatPrice(plan.pricePerDelivery)}
                </span>
                <span className="text-[11.5px] text-ink-soft">{dict.subscription.perDelivery}</span>
              </p>

              <Button
                className="mt-4"
                size="lg"
                fullWidth
                onClick={() => {
                  if (!isAuthenticated) {
                    router.push(`${localePath(locale, '/login')}?redirect=/subscription`);
                    return;
                  }
                  setSelected(plan);
                }}
              >
                {dict.subscription.subscribe}
              </Button>
            </div>
          </article>
        ))}
      </div>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? pickLocalized(selected.name, locale) : ''}
        description={dict.checkout.deliveryInfo}
        footer={
          <Button size="lg" fullWidth loading={subscribe.isPending} onClick={() => subscribe.mutate()}>
            {dict.subscription.subscribe}
          </Button>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="sub-recipient"
            label={dict.checkout.recipientName}
            required
            value={form.recipient}
            onChange={(event) => setForm((s) => ({ ...s, recipient: event.target.value }))}
          />
          <Input
            id="sub-phone"
            label={dict.checkout.phone}
            required
            value={form.phone}
            onChange={(event) => setForm((s) => ({ ...s, phone: event.target.value }))}
          />
          <Select
            id="sub-region"
            label={dict.checkout.region}
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
            id="sub-city"
            label={dict.checkout.city}
            required
            value={form.city}
            onChange={(event) => setForm((s) => ({ ...s, city: event.target.value }))}
          />
          <Input
            id="sub-street"
            label={dict.checkout.street}
            required
            wrapperClassName="sm:col-span-2"
            value={form.street}
            onChange={(event) => setForm((s) => ({ ...s, street: event.target.value }))}
          />
          <Input
            id="sub-building"
            label={dict.checkout.building}
            value={form.building}
            onChange={(event) => setForm((s) => ({ ...s, building: event.target.value }))}
          />
          <Input
            id="sub-apartment"
            label={dict.checkout.apartment}
            value={form.apartment}
            onChange={(event) => setForm((s) => ({ ...s, apartment: event.target.value }))}
          />
          <Textarea
            id="sub-notes"
            label={dict.checkout.notes}
            wrapperClassName="sm:col-span-2"
            value={form.notes}
            onChange={(event) => setForm((s) => ({ ...s, notes: event.target.value }))}
          />
        </div>

        <p className={cn('mt-4 rounded-card bg-surface-soft px-3 py-2.5 text-[11.5px] leading-relaxed text-ink-soft')}>
          {dict.checkout.cashOnDeliveryHint}
        </p>
      </Modal>
    </>
  );
}
