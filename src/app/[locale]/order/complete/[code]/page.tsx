import { notFound } from 'next/navigation';
import { getDictionary, isLocale, localePath, type Locale } from '@/lib/i18n';
import { ButtonLink } from '@/components/ui/Button';
import { CheckIcon, ClockIcon, PhoneIcon, TruckIcon } from '@/components/ui/Icons';
import { CopyCode } from '@/components/cart/CopyCode';

export const metadata = { title: 'Order confirmed' };

export default async function OrderCompletePage(
  props: {
    params: Promise<{ locale: string; code: string }>;
  }
) {
  const params = await props.params;
  if (!isLocale(params.locale)) notFound();
  const dict = getDictionary(params.locale);

  const steps = [
    { icon: PhoneIcon, label: dict.orderComplete.step1 },
    { icon: ClockIcon, label: dict.orderComplete.step2 },
    { icon: TruckIcon, label: dict.orderComplete.step3 },
    { icon: CheckIcon, label: dict.orderComplete.step4 },
  ];

  return (
    <div className="rail flex flex-col items-center py-16 text-center lg:py-24">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-white">
        <CheckIcon className="h-8 w-8" />
      </span>

      <h1 className="mt-6 text-[24px] font-semibold tracking-tight text-ink-strong lg:text-[30px]">
        {dict.orderComplete.title}
      </h1>
      <p className="mt-2 text-[13.5px] text-ink-muted">{dict.orderComplete.subtitle}</p>

      <div className="mt-8 w-full max-w-md rounded-tile border border-line px-6 py-5">
        <p className="text-[12px] text-ink-soft">{dict.orderComplete.orderNumber}</p>
        <CopyCode code={params.code} copyLabel={dict.common.copy} copiedLabel={dict.common.copied} />
        <p className="mt-2 text-[11.5px] text-ink-faint">{dict.orderComplete.saveNumber}</p>
      </div>

      <section className="mt-12 w-full max-w-3xl">
        <h2 className="mb-6 text-[15px] font-semibold text-ink-strong">{dict.orderComplete.whatNext}</h2>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step.label} className="flex flex-col items-center gap-2 rounded-tile border border-line px-4 py-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-soft text-brand">
                <step.icon className="h-5 w-5" />
              </span>
              <span className="text-[11px] text-ink-faint">{index + 1}</span>
              <span className="text-[12.5px] leading-snug text-ink-muted">{step.label}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <ButtonLink href={localePath(params.locale, '/account/orders')} size="lg" variant="outline">
          {dict.orderComplete.viewOrder}
        </ButtonLink>
        <ButtonLink href={localePath(params.locale, '/')} size="lg">
          {dict.orderComplete.backHome}
        </ButtonLink>
      </div>
    </div>
  );
}
