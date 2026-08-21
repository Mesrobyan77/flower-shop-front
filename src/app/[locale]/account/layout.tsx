import { getDictionary, type Locale } from '@/lib/i18n';
import { AccountShell } from '@/components/account/AccountShell';

export default function AccountLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: Locale };
}) {
  const dict = getDictionary(params.locale);
  return (
    <AccountShell locale={params.locale} dict={dict}>
      {children}
    </AccountShell>
  );
}
