import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getDictionary, isLocale, type Locale } from '@/lib/i18n';
import { buildPageMetadata } from '@/lib/seo';
import { PageShell, InfoBlocks } from '@/components/layout/PageShell';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.locale)) return {};
  const dict = getDictionary(params.locale);
  return buildPageMetadata({
    locale: params.locale,
    path: '/terms',
    title: dict.support.terms,
    description: dict.meta.description,
  });
}

export default async function TermsPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  if (!isLocale(params.locale)) notFound();
  const dict = getDictionary(params.locale);

  return (
    <PageShell locale={params.locale} dict={dict} title={dict.support.terms} narrow>
      <InfoBlocks
        blocks={[
          { title: dict.support.terms, body: dict.meta.description },
          { title: dict.checkout.payment, body: dict.checkout.cashOnDeliveryHint },
          { title: dict.delivery.title, body: `${dict.delivery.quickDesc}\n${dict.delivery.parcelDesc}` },
        ]}
      />
    </PageShell>
  );
}
