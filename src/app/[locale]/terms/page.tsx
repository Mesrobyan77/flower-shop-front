import { getDictionary, type Locale } from '@/lib/i18n';
import { PageShell, InfoBlocks } from '@/components/layout/PageShell';

export default function TermsPage({ params }: { params: { locale: Locale } }) {
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
