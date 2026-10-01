import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getDictionary, isLocale } from '@/lib/i18n';
import { Skeleton } from '@/components/ui/Feedback';
import { PaymentReturn } from '@/components/cart/PaymentReturn';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.locale)) return {};
  const dict = getDictionary(params.locale);
  return {
    title: dict.paymentReturn.title,
    robots: { index: false, follow: false },
  };
}

export default async function PaymentReturnPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  if (!isLocale(params.locale)) notFound();
  const dict = getDictionary(params.locale);

  return (
    <div className="rail py-10 lg:py-16">
      <div className="mx-auto w-full max-w-xl">
        <h1 className="mb-6 text-center text-[22px] font-semibold tracking-tight text-ink-strong lg:text-[26px]">
          {dict.paymentReturn.title}
        </h1>
        <Suspense fallback={<Skeleton className="h-64 w-full" />}>
          <PaymentReturn locale={params.locale} dict={dict} />
        </Suspense>
      </div>
    </div>
  );
}
