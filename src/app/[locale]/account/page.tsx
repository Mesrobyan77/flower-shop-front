import { notFound } from 'next/navigation';
import { getDictionary, isLocale, type Locale } from '@/lib/i18n';
import { AccountDashboard } from '@/components/account/AccountPanels';

export default async function AccountPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  if (!isLocale(params.locale)) notFound();
  return <AccountDashboard locale={params.locale} dict={getDictionary(params.locale)} />;
}
