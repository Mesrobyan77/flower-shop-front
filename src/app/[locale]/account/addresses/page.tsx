import { getDictionary, type Locale } from '@/lib/i18n';
import { AddressesPanel } from '@/components/account/AccountPanels';

export default function AccountAddressesPage({ params }: { params: { locale: Locale } }) {
  return <AddressesPanel dict={getDictionary(params.locale)} />;
}
