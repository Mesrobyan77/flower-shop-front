import { getDictionary, type Locale } from '@/lib/i18n';
import { OrdersPanel } from '@/components/account/AccountPanels';

export default function AccountOrdersPage({ params }: { params: { locale: Locale } }) {
  return <OrdersPanel locale={params.locale} dict={getDictionary(params.locale)} />;
}
