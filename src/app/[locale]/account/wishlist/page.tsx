import { notFound } from 'next/navigation';
import { getDictionary, isLocale, type Locale } from '@/lib/i18n';
import { WishlistPanel } from '@/components/account/AccountPanels';

export default async function AccountWishlistPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  if (!isLocale(params.locale)) notFound();
  return <WishlistPanel locale={params.locale} dict={getDictionary(params.locale)} />;
}
