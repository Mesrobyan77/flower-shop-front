import { getDictionary, type Locale } from '@/lib/i18n';
import { SubscriptionsPanel } from '@/components/account/AccountPanels';

export default function AccountSubscriptionsPage({ params }: { params: { locale: Locale } }) {
  return <SubscriptionsPanel locale={params.locale} dict={getDictionary(params.locale)} />;
}
