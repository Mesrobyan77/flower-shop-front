import { notFound } from 'next/navigation';
import { getDictionary, isLocale, localePath, type Locale } from '@/lib/i18n';
import { Breadcrumb } from '@/components/ui/Display';
import { CartView } from '@/components/cart/CartView';

export const metadata = { title: 'Cart' };

export default async function CartPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  if (!isLocale(params.locale)) notFound();
  const dict = getDictionary(params.locale);

  return (
    <div className="rail py-6 lg:py-10">
      <Breadcrumb
        items={[
          { label: dict.product.breadcrumbHome, href: localePath(params.locale, '/') },
          { label: dict.cart.title },
        ]}
      />
      <h1 className="mb-6 mt-4 text-[22px] font-semibold tracking-tight text-ink-strong lg:mb-8 lg:mt-6 lg:text-[28px]">
        {dict.cart.title}
      </h1>
      <CartView locale={params.locale} dict={dict} />
    </div>
  );
}
