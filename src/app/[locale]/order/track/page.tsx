import { getDictionary, localePath, type Locale } from '@/lib/i18n';
import { Breadcrumb } from '@/components/ui/Display';
import { GuestOrderLookup } from '@/components/cart/GuestOrderLookup';

export const metadata = { title: 'Order lookup' };

export default function TrackOrderPage({ params }: { params: { locale: Locale } }) {
  const dict = getDictionary(params.locale);

  return (
    <div className="rail py-6 lg:py-10">
      <Breadcrumb
        items={[
          { label: dict.product.breadcrumbHome, href: localePath(params.locale, '/') },
          { label: dict.auth.guestLookupTitle },
        ]}
      />
      <div className="mx-auto mt-6 max-w-md lg:mt-10">
        <h1 className="text-[22px] font-semibold tracking-tight text-ink-strong">{dict.auth.guestLookupTitle}</h1>
        <p className="mt-2 text-[13px] text-ink-muted">{dict.auth.guestLookupHint}</p>
        <GuestOrderLookup locale={params.locale} dict={dict} />
      </div>
    </div>
  );
}
