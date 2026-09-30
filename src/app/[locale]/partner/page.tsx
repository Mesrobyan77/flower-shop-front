import { notFound } from 'next/navigation';
import { getDictionary, isLocale, type Locale } from '@/lib/i18n';
import { PageShell, InfoBlocks } from '@/components/layout/PageShell';

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
