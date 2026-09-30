import { notFound } from 'next/navigation';
import { getDictionary, isLocale, type Locale } from '@/lib/i18n';
import { AddressesPanel } from '@/components/account/AccountPanels';

export default async function AccountAddressesPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  if (!isLocale(params.locale)) notFound();
  return <AddressesPanel dict={getDictionary(params.locale)} />;
}
