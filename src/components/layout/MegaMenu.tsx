'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { localePath, pickLocalized, type Dictionary, type Locale } from '@/lib/i18n';
import type { Category } from '@/types';

/**
 * `#nav-gnb_open` in the reference: an absolutely positioned frosted panel
 * anchored under the hamburger, listing the full category tree two levels deep.
 */
export function MegaMenu({
  open,
  locale,
  dict,
  categories,
  onClose,
}: {
  open: boolean;
  locale: Locale;
  dict: Dictionary;
  categories: Category[];
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return undefined;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[90]" onClick={onClose} aria-hidden />
      <div
        className="panel-glass absolute left-[15px] top-[50px] z-[95] animate-slide-down rounded-card p-6 text-ink"
        role="menu"
      >
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-x-10 gap-y-6 lg:grid-cols-3 2xl:grid-cols-4">
            {categories.map((category) => (
              <div key={category.id} className="min-w-[150px]">
                <Link
                  href={localePath(locale, `/catalog/${category.slug}`)}
                  className="mb-2 block text-[14px] font-semibold text-ink-strong transition-colors duration-fast hover:text-brand"
                  onClick={onClose}
                  role="menuitem"
                >
                  {pickLocalized(category.name, locale)}
                </Link>
                <ul className="flex flex-col gap-1.5">
                  {category.children.map((child) => (
                    <li key={child.id}>
                      <Link
                        href={localePath(locale, `/catalog/${child.slug}`)}
                        className="text-[12.5px] text-ink-muted transition-colors duration-fast hover:text-brand"
                        onClick={onClose}
                        role="menuitem"
                      >
                        {pickLocalized(child.name, locale)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-line-soft pt-4 text-[12.5px] text-ink-muted">
            <Link href={localePath(locale, '/new')} onClick={onClose} className="hover:text-brand">
              {dict.home.newArrivals}
            </Link>
            <Link href={localePath(locale, '/subscription')} onClick={onClose} className="hover:text-brand">
              {dict.nav.subscription}
            </Link>
            <Link href={localePath(locale, '/delivery')} onClick={onClose} className="hover:text-brand">
              {dict.delivery.title}
            </Link>
            <Link href={localePath(locale, '/magazine')} onClick={onClose} className="hover:text-brand">
              {dict.support.magazine}
            </Link>
            <Link href={localePath(locale, '/events')} onClick={onClose} className="hover:text-brand">
              {dict.support.events}
            </Link>
            <Link href={localePath(locale, '/support')} onClick={onClose} className="hover:text-brand">
              {dict.support.title}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
