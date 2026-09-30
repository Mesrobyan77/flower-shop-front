import { notFound } from 'next/navigation';
import { serverGet } from '@/lib/api/client';
import { getDictionary, isLocale, type Locale } from '@/lib/i18n';
import { PageShell } from '@/components/layout/PageShell';
import { TruckIcon, ClockIcon, CheckIcon } from '@/components/ui/Icons';
import { formatPrice } from '@/lib/utils';
import type { AppConfig } from '@/types';

export const revalidate = 600;

export default async function DeliveryPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  if (!isLocale(params.locale)) notFound();
  const dict = getDictionary(params.locale);
  const config = await serverGet<AppConfig>('/config');

  const methods = [
    {
      key: 'quick' as const,
      icon: ClockIcon,
      fee: config ? formatPrice(config.delivery.quickFee) : '',
      free: null,
    },
    {
      key: 'parcel' as const,
      icon: TruckIcon,
      fee: config ? formatPrice(config.delivery.parcelFee) : '',
      free: config ? formatPrice(config.delivery.freeParcelThreshold) : null,
    },
    {
      key: 'pickup' as const,
      icon: CheckIcon,
      fee: dict.common.free,
      free: null,
    },
  ];

  const quickRegions = (config?.regions ?? []).filter((region) => region.quick);
  const remoteRegions = (config?.regions ?? []).filter((region) => region.remote);

  return (
    <PageShell locale={params.locale} dict={dict} title={dict.delivery.title}>
      <div className="grid gap-4 lg:grid-cols-3">
        {methods.map((method) => (
          <section key={method.key} className="rounded-tile border border-line p-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand">
              <method.icon className="h-5 w-5" />
            </span>
            <h2 className="mt-4 text-[15px] font-semibold text-ink-strong">{dict.delivery[method.key]}</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
              {dict.delivery[`${method.key}Desc` as 'quickDesc']}
            </p>

            <dl className="mt-4 flex flex-col gap-1.5 border-t border-line-soft pt-4 text-[12.5px]">
              <div className="flex justify-between">
                <dt className="text-ink-muted">{dict.delivery.fee}</dt>
                <dd className="font-medium text-ink">{method.fee}</dd>
              </div>
              {method.free && (
                <div className="flex justify-between">
                  <dt className="text-ink-muted">{dict.delivery.freeOver}</dt>
                  <dd className="font-medium text-brand">{method.free}</dd>
                </div>
              )}
            </dl>
          </section>
        ))}
      </div>

      <section className="mt-10 grid gap-4 lg:grid-cols-2">
        <div className="rounded-tile border border-line p-6">
          <h2 className="text-[14px] font-semibold text-ink-strong">{dict.delivery.quick}</h2>
          <p className="mt-2 text-[12.5px] text-ink-muted">
            {quickRegions
              .map((region) => dict.regions[region.key as keyof typeof dict.regions] ?? region.key)
              .join(' · ')}
          </p>
          <p className="mt-3 text-[12px] leading-relaxed text-ink-faint">{dict.delivery.noWeekendQuick}</p>
        </div>

        <div className="rounded-tile border border-line p-6">
          <h2 className="text-[14px] font-semibold text-ink-strong">{dict.delivery.remoteSurcharge}</h2>
          <p className="mt-2 text-[12.5px] text-ink-muted">
            {remoteRegions
              .map((region) => dict.regions[region.key as keyof typeof dict.regions] ?? region.key)
              .join(' · ')}
          </p>
          {config && (
            <p className="mt-3 text-[12.5px] font-medium text-ink">+ {formatPrice(config.delivery.ruralSurcharge)}</p>
          )}
        </div>
      </section>

      <section className="mt-10 rounded-tile border border-brand bg-brand-50/40 p-6">
        <h2 className="text-[14px] font-semibold text-brand-700">{dict.checkout.cashOnDelivery}</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">{dict.checkout.cashOnDeliveryHint}</p>
      </section>
    </PageShell>
  );
}
