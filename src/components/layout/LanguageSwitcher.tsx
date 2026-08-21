'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { locales, localeNames, localeShort, switchLocalePath, type Locale } from '@/lib/i18n';
import { GlobeIcon } from '@/components/ui/Icons';

/**
 * The reference had a country selector in the same slot. Ours switches locale by
 * rewriting the first path segment and remembering the choice in a cookie the
 * middleware reads on the next unprefixed visit.
 */
export function LanguageSwitcher({
  locale,
  transparent,
  label,
  inline,
}: {
  locale: Locale;
  transparent?: boolean;
  label: string;
  inline?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const change = (next: Locale) => {
    document.cookie = `xf-locale=${next}; path=/; max-age=${60 * 60 * 24 * 365}`;
    // Read the query straight off the URL so this component never triggers a CSR bailout.
    const query = typeof window === 'undefined' ? '' : window.location.search.slice(1);
    router.push(`${switchLocalePath(pathname, next)}${query ? `?${query}` : ''}`);
    setOpen(false);
  };

  if (inline) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-[12px] text-ink-soft">{label}</span>
        <div className="flex gap-1">
          {locales.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => change(code)}
              className={cn(
                'rounded-card border px-2.5 py-1 text-[11px] transition-colors duration-fast',
                code === locale ? 'border-brand bg-brand text-white' : 'border-line bg-white text-ink-muted',
              )}
            >
              {localeShort[code]}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        className="flex items-center gap-1.5 whitespace-nowrap px-2.5 py-2.5 text-[13px] transition-opacity duration-fast hover:opacity-75"
      >
        <GlobeIcon className="h-4 w-4" />
        {localeShort[locale]}
      </button>

      {open && (
        <ul
          role="listbox"
          className={cn(
            'absolute right-0 top-full z-[110] min-w-[130px] animate-slide-down overflow-hidden rounded-card',
            'border border-line bg-white py-1 text-ink shadow-menu',
            transparent && 'text-ink',
          )}
        >
          {locales.map((code) => (
            <li key={code}>
              <button
                type="button"
                role="option"
                aria-selected={code === locale}
                onClick={() => change(code)}
                className={cn(
                  'flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-[12.5px]',
                  'transition-colors duration-fast hover:bg-surface-soft',
                  code === locale && 'font-semibold text-brand',
                )}
              >
                {localeNames[code]}
                <span className="text-[10px] text-ink-faint">{localeShort[code]}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
