import { getDictionary, type Locale } from '@/lib/i18n';
import { ProfilePanel } from '@/components/account/AccountPanels';

export default function AccountProfilePage({ params }: { params: { locale: Locale } }) {
  return <ProfilePanel dict={getDictionary(params.locale)} />;
}
