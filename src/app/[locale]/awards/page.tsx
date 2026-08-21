import { serverGet } from '@/lib/api/client';
import { getDictionary, localePath, type Locale } from '@/lib/i18n';
import { PageShell } from '@/components/layout/PageShell';
import { formatNumber } from '@/lib/utils';
import type { StoreSettings } from '@/types';

export const revalidate = 600;

export default async function AwardsPage({ params }: { params: { locale: Locale } }) {
  const dict = getDictionary(params.locale);
  const settings = await serverGet<StoreSettings>('/settings');
  const counters = settings?.counters ?? { reviews: 0, deliveries: 0, awardYears: 0 };

  const tiles = [
    { value: formatNumber(counters.awardYears), label: dict.home.counterAward },
    { value: formatNumber(counters.deliveries), label: dict.home.counterDeliveries },
    { value: formatNumber(counters.reviews), label: dict.home.counterReviews },
  ];

  return (
    <PageShell
      locale={params.locale}
      dict={dict}
      title={dict.support.about}
      subtitle={dict.meta.description}
      crumbs={[{ label: dict.support.about, href: localePath(params.locale, '/about') }]}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-tile border border-line px-6 py-8 text-center">
            <p className="font-display text-[30px] font-bold leading-none tracking-tight text-brand">{tile.value}</p>
            <p className="mt-2 text-[12.5px] leading-relaxed text-ink-soft">{tile.label}</p>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
