'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Drawer } from '@/components/ui/Overlay';
import { ChevronDownIcon } from '@/components/ui/Icons';
import { localePath, pickLocalized, type Dictionary, type Locale } from '@/lib/i18n';
import { useSession, useLogout } from '@/lib/hooks/useAuth';
import { useUiStore } from '@/store/ui';
import { cn } from '@/lib/utils';
import { LanguageSwitcher } from './LanguageSwitcher';
import type { Category } from '@/types';

export function MobileNav({
  locale,
  dict,
  categories,
}: {
  locale: Locale;
  dict: Dictionary;
  categories: Category[];
}) {
  const open = useUiStore((s) => s.mobileNavOpen);
  const toggle = useUiStore((s) => s.toggleMobileNav);
  const { user, isAuthenticated } = useSession();
  const logout = useLogout(locale);
  const [expanded, setExpanded] = useState<string | null>(null);

  const close = () => toggle(false);

  return (
    <Drawer open={open} onClose={close} title={dict.nav.allMenu} widthClass="max-w-[320px]">
      <div className="flex flex-col">
        <div className="border-b border-line-soft bg-surface-soft px-5 py-4">
          {isAuthenticated ? (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[14px] font-semibold text-ink-strong">{user?.name}</p>
                <p className="truncate text-[12px] text-ink-soft">{user?.email}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  logout.mutate();
                  close();
                }}
                className="shrink-0 rounded-card border border-line-strong bg-white px-3 py-1.5 text-[11px]"
              >
                {dict.auth.logout}
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link
                href={localePath(locale, '/login')}
                onClick={close}
                className="flex h-10 flex-1 items-center justify-center rounded-card bg-brand text-[13px] font-medium text-white"
              >
                {dict.auth.login}
              </Link>
              <Link
                href={localePath(locale, '/register')}
                onClick={close}
                className="flex h-10 flex-1 items-center justify-center rounded-card border border-line-strong bg-white text-[13px] font-medium"
              >
                {dict.auth.register}
              </Link>
            </div>
          )}
        </div>

        <nav className="flex flex-col py-2">
          <Link
            href={`${localePath(locale, '/catalog/flower-gifts')}?delivery=quick`}
            onClick={close}
            className="px-5 py-3 text-[14px] font-semibold text-brand"
          >
            {dict.nav.today} +
          </Link>

          {categories.map((category) => (
            <div key={category.id} className="border-t border-line-soft">
              <div className="flex items-center">
                <Link
                  href={localePath(locale, `/catalog/${category.slug}`)}
                  onClick={close}
                  className="flex-1 px-5 py-3 text-[14px] text-ink"
                >
                  {pickLocalized(category.name, locale)}
                </Link>
                {category.children.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setExpanded(expanded === category.id ? null : category.id)}
                    aria-expanded={expanded === category.id}
                    aria-label={pickLocalized(category.name, locale)}
                    className="flex h-11 w-11 items-center justify-center text-ink-soft"
                  >
                    <ChevronDownIcon
                      className={cn(
                        'h-4 w-4 transition-transform duration-fast',
                        expanded === category.id && 'rotate-180',
                      )}
                    />
                  </button>
                )}
              </div>

              {expanded === category.id && category.children.length > 0 && (
                <ul className="animate-slide-down bg-surface-soft py-1">
                  {category.children.map((child) => (
                    <li key={child.id}>
                      <Link
                        href={localePath(locale, `/catalog/${child.slug}`)}
                        onClick={close}
                        className="block px-8 py-2.5 text-[13px] text-ink-muted"
                      >
                        {pickLocalized(child.name, locale)}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          <div className="mt-2 border-t border-line-soft pt-2">
            {[
              { label: dict.nav.subscription, href: '/subscription' },
              { label: dict.delivery.title, href: '/delivery' },
              { label: dict.support.magazine, href: '/magazine' },
              { label: dict.support.events, href: '/events' },
              { label: dict.nav.b2b, href: '/partner' },
              { label: dict.support.title, href: '/support' },
            ].map((link) => (
              <Link
                key={link.href}
                href={localePath(locale, link.href)}
                onClick={close}
                className="block px-5 py-2.5 text-[13px] text-ink-muted"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>

        <div className="mt-auto border-t border-line-soft px-5 py-4">
          <LanguageSwitcher locale={locale} label={dict.nav.language} inline />
        </div>
      </div>
    </Drawer>
  );
}
