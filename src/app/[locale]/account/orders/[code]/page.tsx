import { getDictionary, type Locale } from '@/lib/i18n';
import { OrderDetailPanel } from '@/components/account/AccountPanels';

export default function AccountOrderDetailPage({
  params,
}: {
  params: { locale: Locale; code: string };
}) {
  return <OrderDetailPanel code={params.code} locale={params.locale} dict={getDictionary(params.locale)} />;
}
