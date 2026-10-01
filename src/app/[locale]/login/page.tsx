import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getDictionary, isLocale, type Locale } from '@/lib/i18n';
import { LoginForm } from '@/components/account/AuthForms';
import { Skeleton } from '@/components/ui/Feedback';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.locale)) return {};
  const dict = getDictionary(params.locale);
  return {
    title: dict.auth.loginTitle,
    robots: { index: false, follow: false },
  };
}

export default async function LoginPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  if (!isLocale(params.locale)) notFound();
  const dict = getDictionary(params.locale);

  return (
    <div className="rail py-12 lg:py-20">
      <h1 className="mb-8 text-center text-[24px] font-semibold tracking-tight text-ink-strong">
        {dict.auth.loginTitle}
      </h1>
      <Suspense fallback={<Skeleton className="mx-auto h-80 w-full max-w-md" />}>
        <LoginForm locale={params.locale} dict={dict} />
      </Suspense>
    </div>
  );
}
