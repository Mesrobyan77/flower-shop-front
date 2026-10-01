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
    path: '/partner',
    title: dict.support.partner,
    description: dict.meta.description,
  });
}

export default async function PartnerPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  if (!isLocale(params.locale)) notFound();
  const dict = getDictionary(params.locale);

  return (
    <PageShell locale={params.locale} dict={dict} title={dict.support.partner} narrow>
      <InfoBlocks
        blocks={[
          { title: dict.nav.b2b, body: dict.meta.description },
          { title: dict.support.phone, body: dict.support.hours },
        ]}
      />
    </PageShell>
  );
}
