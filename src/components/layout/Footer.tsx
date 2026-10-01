'use client';

import Link from 'next/link';
import { localePath, pickLocalized, type Dictionary, type Locale } from '@/lib/i18n';
import { useCategories, useStoreSettings } from '@/lib/hooks/useCatalog';
import {
  ClockIcon,
  FacebookIcon,
  FileIcon,
  InstagramIcon,
  ListIcon,
  MailIcon,
  PhoneIcon,
  TelegramIcon,
  TruckIcon,
  YouTubeIcon,
} from '@/components/ui/Icons';
import { Wordmark } from './Wordmark';

const SOCIAL_LINKS: Record<string, { label: string; Icon: typeof InstagramIcon; background: string }> = {
  instagram: {
    label: 'Instagram',
    Icon: InstagramIcon,
    background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
  },
  facebook: { label: 'Facebook', Icon: FacebookIcon, background: '#1877f2' },
  youtube: { label: 'YouTube', Icon: YouTubeIcon, background: '#ff0000' },
  telegram: { label: 'Telegram', Icon: TelegramIcon, background: '#229ed9' },
};

/**
 * Footer follows the reference's three-row structure: brand + quick links +
 * contact, then categories + legal + social, then the payment note and the
 * copyright line. Every link targets a route that exists; social icons render
 * only for networks configured in store settings.
 */
export function Footer({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const { data: settings } = useStoreSettings();
  const { data: categories } = useCategories(true);
  const contact = settings?.contact;
  const social = settings?.social;

  const topCategories = (categories ?? []).slice(0, 8);

  const quickLinks = [
    { label: dict.footer.home, href: '/' },
    { label: dict.footer.flowers, href: '/catalog' },
    { label: dict.footer.contactUs, href: '/support' },
    { label: dict.nav.cart, href: '/cart' },
    { label: dict.auth.guestLookupTitle, href: '/order/track' },
  ];

  const legalLinks = [
    { label: dict.support.privacy, href: '/privacy', Icon: FileIcon },
    { label: dict.support.terms, href: '/terms', Icon: ListIcon },
    { label: dict.delivery.title, href: '/delivery', Icon: TruckIcon },
  ];

  const payments = [dict.checkout.cashOnDelivery, dict.checkout.paymentIdram, dict.checkout.paymentCard];

  return (
    <footer className="mt-16 border-t border-line bg-surface-soft">
      <div className="rail py-12 lg:py-16">
        {/* row 1: brand, quick links, contact */}
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <Wordmark tone="brand" className="mb-5" />
            <p className="max-w-sm text-[12.5px] leading-relaxed text-ink-muted">{dict.footer.tagline}</p>
          </div>

          <div>
            <h3 className="font-display text-[15px] font-bold text-ink-strong">{dict.footer.quickLinks}</h3>
            <ul className="mt-4 flex flex-col gap-2.5">
              {quickLinks.map((link) => (
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

          <div>
            <h3 className="font-display text-[15px] font-bold text-ink-strong">{dict.footer.contactTitle}</h3>
            <ul className="mt-4 flex flex-col gap-2.5 text-[12.5px] text-ink-muted">
              <li>
                <a
                  href={`tel:${contact?.phone ?? ''}`}
                  className="inline-flex items-center gap-2 transition-colors duration-fast hover:text-brand"
                >
                  <PhoneIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  {contact?.phone ?? '+374 10 500 700'}
                </a>
              </li>
              {contact?.email && (
                <li>
                  <a
                    href={`mailto:${contact.email}`}
                    className="inline-flex items-center gap-2 transition-colors duration-fast hover:text-brand"
                  >
                    <MailIcon className="h-3.5 w-3.5" aria-hidden="true" />
                    {contact.email}
                  </a>
                </li>
              )}
              <li className="inline-flex items-center gap-2">
                <ClockIcon className="h-3.5 w-3.5" aria-hidden="true" />
                {pickLocalized(contact?.hours, locale) || dict.support.hours}
              </li>
            </ul>
          </div>
        </div>

        {/* row 2: categories, legal, social */}
        <div className="mt-12 grid gap-10 border-t border-line pt-10 md:grid-cols-2 lg:grid-cols-3">
          {topCategories.length > 0 && (
            <div>
              <h3 className="font-display text-[15px] font-bold text-ink-strong">{dict.footer.categoriesTitle}</h3>
              <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2.5">
                {topCategories.map((category) => (
                  <li key={category.slug}>
                    <Link
                      href={localePath(locale, `/catalog/${category.slug}`)}
                      className="text-[12.5px] text-ink-muted transition-colors duration-fast hover:text-brand"
                    >
                      {pickLocalized(category.name, locale)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h3 className="font-display text-[15px] font-bold text-ink-strong">{dict.footer.legalTitle}</h3>
            <ul className="mt-4 flex flex-col gap-2.5">
              {legalLinks.map(({ label, href, Icon }) => (
                <li key={href}>
                  <Link
                    href={localePath(locale, href)}
                    className="inline-flex items-center gap-2 text-[12.5px] text-ink-muted transition-colors duration-fast hover:text-brand"
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display text-[15px] font-bold text-ink-strong">{dict.footer.followUs}</h3>
            {social && (
              <div className="mt-4 flex gap-2.5">
                {Object.entries(social)
                  .filter(([key, href]) => Boolean(href) && Boolean(SOCIAL_LINKS[key]))
                  .map(([key, href]) => {
                    const { label, Icon, background } = SOCIAL_LINKS[key];
                    return (
                      <a
                        key={key}
                        href={href as string}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={label}
                        title={label}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-white shadow-sm transition-transform duration-fast hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                        style={{ background }}
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </a>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        {/* row 3: payment methods */}
        <div className="mt-12 flex flex-col items-center gap-3 border-t border-line pt-10 text-center">
          <p className="text-[12px] font-semibold text-ink-strong">{dict.footer.paymentsTitle}</p>
          <ul className="flex flex-wrap justify-center gap-2">
            {payments.map((label) => (
              <li
                key={label}
                className="inline-flex h-8 items-center rounded-card border border-line bg-white px-3 text-[11.5px] font-medium text-ink-muted"
              >
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 border-t border-line pt-6 text-center text-[11px] text-ink-faint">
          © {new Date().getFullYear()} {dict.meta.siteName}. {dict.footer.copyright}
        </div>
      </div>
    </footer>
  );
}
