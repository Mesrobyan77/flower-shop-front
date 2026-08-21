import { getDictionary, type Locale } from '@/lib/i18n';
import { RegisterForm } from '@/components/account/AuthForms';

export const metadata = { title: 'Register' };

export default function RegisterPage({ params }: { params: { locale: Locale } }) {
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
