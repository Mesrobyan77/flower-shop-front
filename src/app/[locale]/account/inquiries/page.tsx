import { getDictionary, type Locale } from '@/lib/i18n';
import { InquiriesPanel } from '@/components/account/AccountPanels';

export default function AccountInquiriesPage({ params }: { params: { locale: Locale } }) {
  return <InquiriesPanel locale={params.locale} dict={getDictionary(params.locale)} />;
}
