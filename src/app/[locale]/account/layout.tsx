import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getDictionary, isLocale, type Locale } from '@/lib/i18n';
import { AccountShell } from '@/components/account/AccountShell';

/** The whole account area is private: never index, never follow. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AccountLayout(
  props: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;
  if (!isLocale(params.locale)) notFound();

  const {
    children
  } = props;

  const dict = getDictionary(params.locale);
  return (
    <AccountShell locale={params.locale} dict={dict}>
      {children}
    </AccountShell>
  );
}
