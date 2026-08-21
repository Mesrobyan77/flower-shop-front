import { getDictionary, type Locale } from '@/lib/i18n';
import { AccountDashboard } from '@/components/account/AccountPanels';

export default function AccountPage({ params }: { params: { locale: Locale } }) {
  return <AccountDashboard locale={params.locale} dict={getDictionary(params.locale)} />;
}
