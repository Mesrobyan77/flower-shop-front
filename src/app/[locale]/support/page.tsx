import { notFound } from 'next/navigation';
import Link from 'next/link';
import { serverGet } from '@/lib/api/client';
import { getDictionary, isLocale, localePath, pickLocalized, type Locale } from '@/lib/i18n';
import { PageShell } from '@/components/layout/PageShell';
import { ClockIcon, MailIcon, PhoneIcon } from '@/components/ui/Icons';
import type { StoreSettings } from '@/types';

export const revalidate = 600;

export default async function SupportPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  if (!isLocale(params.locale)) notFound();
  const { locale } = params;
  const dict = getDictionary(locale);
  const settings = await serverGet<StoreSettings>('/settings');
  const contact = settings?.contact;

  const links = [
    { label: dict.support.faq, href: '/support/faq' },
    { label: dict.support.notice, href: '/support/notice' },
    { label: dict.delivery.title, href: '/delivery' },
    { label: dict.auth.guestLookupTitle, href: '/order/track' },
  ];

  return (
    <PageShell locale={locale} dict={dict} title={dict.support.title}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-3 sm:grid-cols-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={localePath(locale, link.href)}
              className="rounded-tile border border-line px-5 py-6 text-[14px] font-medium text-ink transition-colors duration-fast hover:border-brand hover:text-brand"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <aside className="rounded-tile border border-line p-6">
          <p className="text-[12px] text-ink-soft">{dict.support.phone}</p>
          <a
            href={`tel:${contact?.phone ?? ''}`}
            className="mt-1 block font-display text-[24px] font-bold tracking-tight text-ink-strong"
          >
            {contact?.phone}
          </a>
          <p className="mt-3 flex items-center gap-1.5 text-[12px] text-ink-soft">
            <ClockIcon className="h-3.5 w-3.5" />
            {pickLocalized(contact?.hours, locale)}
          </p>
          {contact?.email && (
            <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-ink-soft">
              <MailIcon className="h-3.5 w-3.5" />
              {contact.email}
            </p>
          )}
          {contact?.overseasPhone && (
            <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-ink-soft">
              <PhoneIcon className="h-3.5 w-3.5" />
              {contact.overseasPhone}
            </p>
          )}
        </aside>
      </div>
    </PageShell>
  );
}
