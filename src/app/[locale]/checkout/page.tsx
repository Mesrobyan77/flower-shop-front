import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getDictionary, isLocale, localePath, type Locale } from '@/lib/i18n';
import { Breadcrumb } from '@/components/ui/Display';
import { CheckoutView } from '@/components/cart/CheckoutView';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.locale)) return {};
  const dict = getDictionary(params.locale);
  return {
    title: dict.checkout.title,
    robots: { index: false, follow: false },
  };
}

export default async function CheckoutPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  if (!isLocale(params.locale)) notFound();
  const dict = getDictionary(params.locale);

  return (
    <div className="rail py-6 lg:py-10">
      <Breadcrumb
        items={[
          { label: dict.product.breadcrumbHome, href: localePath(params.locale, '/') },
          { label: dict.cart.title, href: localePath(params.locale, '/cart') },
          { label: dict.checkout.title },
        ]}
      />
      <h1 className="mb-6 mt-4 text-[22px] font-semibold tracking-tight text-ink-strong lg:mb-8 lg:mt-6 lg:text-[28px]">
        {dict.checkout.title}
      </h1>
      <CheckoutView locale={params.locale} dict={dict} />
    </div>
  );
}
