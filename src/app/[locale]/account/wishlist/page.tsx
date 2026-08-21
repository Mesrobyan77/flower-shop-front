import { getDictionary, type Locale } from '@/lib/i18n';
import { WishlistPanel } from '@/components/account/AccountPanels';

export default function AccountWishlistPage({ params }: { params: { locale: Locale } }) {
  return <WishlistPanel locale={params.locale} dict={getDictionary(params.locale)} />;
}
