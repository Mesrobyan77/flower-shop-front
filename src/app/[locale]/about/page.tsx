import { getDictionary, type Locale } from '@/lib/i18n';
import { PageShell, InfoBlocks } from '@/components/layout/PageShell';

export default function AboutPage({ params }: { params: { locale: Locale } }) {
  const dict = getDictionary(params.locale);

  return (
    <PageShell locale={params.locale} dict={dict} title={dict.support.about} narrow>
      <InfoBlocks
        blocks={[
          { title: dict.meta.siteName, body: dict.meta.description },
          { title: dict.delivery.title, body: `${dict.delivery.quickDesc}\n${dict.delivery.parcelDesc}` },
          { title: dict.checkout.cashOnDelivery, body: dict.checkout.cashOnDeliveryHint },
        ]}
      />
    </PageShell>
  );
}
