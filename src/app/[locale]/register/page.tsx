import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getDictionary, isLocale, type Locale } from '@/lib/i18n';
import { RegisterForm } from '@/components/account/AuthForms';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.locale)) return {};
  const dict = getDictionary(params.locale);
  return {
    title: dict.auth.registerTitle,
    robots: { index: false, follow: false },
  };
}

export default async function RegisterPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  if (!isLocale(params.locale)) notFound();
  const dict = getDictionary(params.locale);

  return (
    <div className="rail py-12 lg:py-20">
      <h1 className="mb-8 text-center text-[24px] font-semibold tracking-tight text-ink-strong">
        {dict.auth.registerTitle}
      </h1>
      <RegisterForm locale={params.locale} dict={dict} />
    </div>
  );
}
