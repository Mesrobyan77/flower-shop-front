import { notFound } from 'next/navigation';
import { getDictionary, isLocale, type Locale } from '@/lib/i18n';
import { ProfilePanel } from '@/components/account/AccountPanels';

export default async function AccountProfilePage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  if (!isLocale(params.locale)) notFound();
  return <ProfilePanel dict={getDictionary(params.locale)} />;
}
