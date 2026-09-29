import { notFound } from 'next/navigation';
import { getDictionary, isLocale, type Locale } from '@/lib/i18n';
import { InquiriesPanel } from '@/components/account/AccountPanels';

export default async function AccountInquiriesPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  if (!isLocale(params.locale)) notFound();
  return <InquiriesPanel locale={params.locale} dict={getDictionary(params.locale)} />;
}
