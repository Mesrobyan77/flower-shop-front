import { getDictionary, type Locale } from '@/lib/i18n';
import { PageShell } from '@/components/layout/PageShell';
import { SubscriptionPlans } from '@/components/home/SubscriptionPlans';

export default function SubscriptionPage({ params }: { params: { locale: Locale } }) {
  const dict = getDictionary(params.locale);

  return (
    <PageShell
      locale={params.locale}
      dict={dict}
      title={dict.subscription.title}
      subtitle={dict.subscription.subtitle}
    >
      <SubscriptionPlans locale={params.locale} dict={dict} />
    </PageShell>
  );
}
