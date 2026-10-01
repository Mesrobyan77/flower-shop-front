import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { serverGet } from '@/lib/api/client';
import { getDictionary, isLocale, localePath, type Locale } from '@/lib/i18n';
import { buildPageMetadata } from '@/lib/seo';
import { PageShell } from '@/components/layout/PageShell';
import { formatNumber } from '@/lib/utils';
import type { StoreSettings } from '@/types';

export const revalidate = 600;

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.locale)) return {};
  const dict = getDictionary(params.locale);
  // The page's own H1 is dict.support.about, so the metadata title matches it.
  return buildPageMetadata({
    locale: params.locale,
    path: '/awards',
    title: dict.support.about,
    description: dict.meta.description,
  });
}

export default async function AwardsPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  if (!isLocale(params.locale)) notFound();
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
