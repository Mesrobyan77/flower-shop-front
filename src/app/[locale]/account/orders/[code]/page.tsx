import { notFound } from 'next/navigation';
import { getDictionary, isLocale, type Locale } from '@/lib/i18n';
import { OrderDetailPanel } from '@/components/account/AccountPanels';

export default async function AccountOrderDetailPage(
  props: {
    params: Promise<{ locale: string; code: string }>;
  }
) {
  const params = await props.params;
  if (!isLocale(params.locale)) notFound();
  return <OrderDetailPanel code={params.code} locale={params.locale} dict={getDictionary(params.locale)} />;
}
