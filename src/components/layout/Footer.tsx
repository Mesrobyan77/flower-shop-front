'use client';

import Link from 'next/link';
import { localePath, pickLocalized, type Dictionary, type Locale } from '@/lib/i18n';
import { useStoreSettings } from '@/lib/hooks/useCatalog';
import { ClockIcon, MailIcon, PhoneIcon, TruckIcon } from '@/components/ui/Icons';
import { Wordmark } from './Wordmark';

/**
 * Footer keeps the reference's information architecture: a support block on the
 * left, a payment/delivery explainer in the middle, then site links and the
 * legal line. Bank-transfer details are dropped because we are cash on delivery.
 */
export function Footer({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const { data: settings } = useStoreSettings();
  const contact = settings?.contact;
  const social = settings?.social;

  const columns = [
    {
      title: dict.support.title,
      links: [
        { label: dict.support.faq, href: '/support/faq' },
        { label: dict.support.notice, href: '/support/notice' },
        { label: dict.support.inquiry, href: '/account/inquiries' },
        { label: dict.delivery.title, href: '/delivery' },
      ],
    },
    {
      title: dict.meta.siteName,
      links: [
        { label: dict.support.about, href: '/about' },
        { label: dict.support.magazine, href: '/magazine' },
        { label: dict.support.events, href: '/events' },
        { label: dict.support.partner, href: '/partner' },
      ],
    },
    {
      title: dict.nav.allMenu,
      links: [
        { label: dict.nav.gifts, href: '/catalog/flower-gifts' },
        { label: dict.nav.opening, href: '/catalog/opening-plants' },
        { label: dict.nav.weddingFuneral, href: '/catalog/wedding-funeral' },
        { label: dict.nav.subscription, href: '/subscription' },
      ],
    },
  ];

  return (
    <footer className="mt-16 border-t border-line bg-surface-soft">
      <div className="rail py-10 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,1fr))]">
          {/* support block */}
          <div>
            <Wordmark tone="brand" className="mb-5" />

            <a
              href={`tel:${contact?.phone ?? ''}`}
              className="block font-display text-[26px] font-bold leading-none tracking-tight text-ink-strong"
            >
              {contact?.phone ?? '+374 10 500 700'}
            </a>

            <p className="mt-2 flex items-center gap-1.5 text-[12px] text-ink-soft">
              <ClockIcon className="h-3.5 w-3.5" />
              {pickLocalized(contact?.hours, locale) || dict.support.hours}
            </p>

            {contact?.email && (
              <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-ink-soft">
                <MailIcon className="h-3.5 w-3.5" />
                <a href={`mailto:${contact.email}`} className="hover:text-brand">
                  {contact.email}
                </a>
              </p>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              <a
                href={`tel:${contact?.phone ?? ''}`}
                className="inline-flex h-9 items-center gap-1.5 rounded-card border border-line-strong bg-white px-3 text-[12px] transition-colors duration-fast hover:border-brand hover:text-brand"
              >
                <PhoneIcon className="h-3.5 w-3.5" />
                {dict.support.phone}
              </a>
              <Link
                href={localePath(locale, '/order/track')}
                className="inline-flex h-9 items-center gap-1.5 rounded-card border border-line-strong bg-white px-3 text-[12px] transition-colors duration-fast hover:border-brand hover:text-brand"
              >
                <TruckIcon className="h-3.5 w-3.5" />
                {dict.auth.guestLookupTitle}
              </Link>
            </div>

            <div className="mt-6 rounded-tile border border-line bg-white p-4">
              <p className="text-[12px] font-semibold text-ink-strong">{dict.checkout.cashOnDelivery}</p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-ink-soft">{dict.checkout.cashOnDeliveryHint}</p>
            </div>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="mb-3 text-[13px] font-semibold text-ink-strong">{column.title}</h3>
              <ul className="flex flex-col gap-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={localePath(locale, link.href)}
                      className="text-[12.5px] text-ink-muted transition-colors duration-fast hover:text-brand"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-line pt-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="text-[11px] leading-relaxed text-ink-faint">
            <p>
              {dict.meta.siteName} · {pickLocalized(contact?.address, locale)}
            </p>
            <p className="mt-1 flex flex-wrap gap-x-3">
              <Link href={localePath(locale, '/terms')} className="hover:text-brand">
                {dict.support.terms}
              </Link>
              <Link href={localePath(locale, '/privacy')} className="font-medium text-ink-soft hover:text-brand">
                {dict.support.privacy}
              </Link>
            </p>
            <p className="mt-2">© {new Date().getFullYear()} {dict.meta.siteName}. All rights reserved.</p>
          </div>

          {social && (
            <div className="flex gap-2">
              {Object.entries(social)
                .filter(([, href]) => Boolean(href))
                .map(([key, href]) => (
                  <a
                    key={key}
                    href={href as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={key}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-[10px] font-semibold uppercase text-ink-soft transition-colors duration-fast hover:border-brand hover:text-brand"
                  >
                    {key.slice(0, 2)}
                  </a>
                ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
