import { Suspense } from 'react';
import { getDictionary, type Locale } from '@/lib/i18n';
import { LoginForm } from '@/components/account/AuthForms';
import { Skeleton } from '@/components/ui/Feedback';

export const metadata = { title: 'Sign in' };

export default function LoginPage({ params }: { params: { locale: Locale } }) {
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
