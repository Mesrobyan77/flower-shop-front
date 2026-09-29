import { notFound } from 'next/navigation';
import { getDictionary, isLocale, type Locale } from '@/lib/i18n';
import { SubscriptionsPanel } from '@/components/account/AccountPanels';

export default async function AccountSubscriptionsPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  if (!isLocale(params.locale)) notFound();
  return <SubscriptionsPanel locale={params.locale} dict={getDictionary(params.locale)} />;
}
