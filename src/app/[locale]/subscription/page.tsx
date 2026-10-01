import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getDictionary, isLocale, type Locale } from '@/lib/i18n';
import { buildPageMetadata } from '@/lib/seo';
import { PageShell } from '@/components/layout/PageShell';
import { SubscriptionPlans } from '@/components/home/SubscriptionPlans';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.locale)) return {};
  const dict = getDictionary(params.locale);
  return buildPageMetadata({
    locale: params.locale,
    path: '/subscription',
    title: dict.subscription.title,
    description: dict.subscription.subtitle,
  });
}

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
