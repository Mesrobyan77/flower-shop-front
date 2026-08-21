import { getDictionary, type Locale } from '@/lib/i18n';
import { PageShell, InfoBlocks } from '@/components/layout/PageShell';

export default function PrivacyPage({ params }: { params: { locale: Locale } }) {
  const dict = getDictionary(params.locale);

  return (
    <PageShell locale={params.locale} dict={dict} title={dict.support.privacy} narrow>
      <InfoBlocks
        blocks={[
          { title: dict.support.privacy, body: dict.meta.description },
          { title: dict.checkout.customer, body: dict.checkout.agreeTerms },
        ]}
      />
    </PageShell>
  );
}
