import { notFound } from 'next/navigation';
import { getDictionary, isLocale, type Locale } from '@/lib/i18n';
import { PageShell } from '@/components/layout/PageShell';
import { SubscriptionPlans } from '@/components/home/SubscriptionPlans';

export default async function SubscriptionPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  if (!isLocale(params.locale)) notFound();
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
