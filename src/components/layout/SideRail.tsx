'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { cn, formatPrice } from '@/lib/utils';
import { localePath, type Dictionary, type Locale } from '@/lib/i18n';
import { useRecentStore } from '@/store/recent';
import { useStoreSettings } from '@/lib/hooks/useCatalog';
import { ArrowUpIcon, PhoneIcon } from '@/components/ui/Icons';

/**
 * The reference floats a support shortcut, a recently-viewed strip and a
 * back-to-top button on the right edge. Same idea, kept out of the way on mobile.
 */
export function SideRail({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [visible, setVisible] = useState(false);
  const [showRecent, setShowRecent] = useState(false);
  const items = useRecentStore((s) => s.items);
  const { data: settings } = useStoreSettings();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-6 right-4 z-[80] flex flex-col items-end gap-2 lg:right-6">
      {items.length > 0 && (
        <div className="pointer-events-auto hidden lg:block">
          {showRecent && (
            <div className="mb-2 w-[92px] animate-fade-up rounded-tile border border-line bg-white p-2 shadow-card">
              <p className="mb-2 text-center text-[10px] text-ink-soft">{dict.account.wishlist}</p>
              <ul className="flex max-h-[280px] flex-col gap-2 overflow-y-auto no-scrollbar">
                {items.slice(0, 5).map((item) => (
                  <li key={item.slug}>
                    <Link href={localePath(locale, `/product/${item.slug}`)} className="block">
                      <span
                        className="block aspect-square w-full rounded-card bg-surface-soft bg-cover bg-center"
                        style={{ backgroundImage: item.thumbnail ? `url(${item.thumbnail})` : undefined }}
                        aria-hidden
                      />
                      <span className="mt-1 block truncate text-[10px] text-ink-muted">{item.name}</span>
                      <span className="block text-[10px] font-semibold text-ink">{formatPrice(item.price)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowRecent((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-[10px] font-semibold text-ink-muted shadow-card transition-colors duration-fast hover:border-brand hover:text-brand"
            aria-expanded={showRecent}
            aria-label={dict.account.wishlist}
          >
            {items.length}
          </button>
        </div>
      )}

      <a
        href={`tel:${settings?.contact?.phone ?? ''}`}
        className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white shadow-glass transition-transform duration-fast hover:scale-105"
        aria-label={dict.support.phone}
      >
        <PhoneIcon className="h-5 w-5" />
      </a>

      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={cn(
          'pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-ink-muted shadow-card',
          'transition-all duration-base hover:border-brand hover:text-brand',
          visible ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        aria-label="Top"
      >
        <ArrowUpIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
