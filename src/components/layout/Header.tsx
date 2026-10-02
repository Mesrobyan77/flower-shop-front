'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { cn } from '@/lib/utils';
import { localePath, pickLocalized, type Dictionary, type Locale } from '@/lib/i18n';
import { useCartCount } from '@/lib/hooks/useCart';
import { useCategories, useStoreSettings } from '@/lib/hooks/useCatalog';
import { useSession } from '@/lib/hooks/useAuth';
import { useUiStore } from '@/store/ui';
import { useRecentStore } from '@/store/recent';
import { BagIcon, CloseIcon, GiftIcon, MenuIcon, SearchIcon, UserIcon } from '@/components/ui/Icons';
import { LanguageSwitcher } from './LanguageSwitcher';
import { MegaMenu } from './MegaMenu';
import { MobileNav } from './MobileNav';
import { Wordmark } from './Wordmark';

interface HeaderProps {
  locale: Locale;
  dict: Dictionary;
}

export function Header({ locale, dict }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isHome = pathname === `/${locale}` || pathname === `/${locale}/`;
  const [scrolled, setScrolled] = useState(false);
  const [term, setTerm] = useState('');

  const { data: settings } = useStoreSettings();
  const { data: categories } = useCategories(true);
  const { isAuthenticated } = useSession();
  const cartCount = useCartCount();

  const megaOpen = useUiStore((s) => s.megaMenuOpen);
  const toggleMega = useUiStore((s) => s.toggleMegaMenu);
  const searchOpen = useUiStore((s) => s.searchOpen);
  const toggleSearch = useUiStore((s) => s.toggleSearch);
  const toggleMobileNav = useUiStore((s) => s.toggleMobileNav);
  const closeAll = useUiStore((s) => s.closeAll);
  const pushSearch = useRecentStore((s) => s.pushSearch);

  const [promoDismissed, setPromoDismissed] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    closeAll();
  }, [pathname, closeAll]);

  const transparent = isHome && !scrolled;

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const clean = term.trim();
    if (!clean) return;
    pushSearch(clean);
    closeAll();
    router.push(`${localePath(locale, '/search')}?q=${encodeURIComponent(clean)}`);
  };

  const promo = settings?.promoBar;
  const showPromo = Boolean(promo?.enabled && !promoDismissed);

  const quickLinks = [
    { label: `${dict.nav.today}+`, href: '/catalog/flower-gifts?delivery=quick' },
    { label: dict.nav.trend, href: '/catalog/trend-pick' },
    { label: dict.nav.diy, href: '/catalog/diy-market' },
    { label: dict.nav.subscription, href: '/subscription' },
    { label: dict.nav.corporate, href: '/partner' },
  ];

  return (
    <>
      {showPromo && promo && (
        <div className="relative z-[120] bg-brand">
          <div className="rail flex h-9 items-center justify-center text-[12px] text-white">
            <Link href={promo.href ? localePath(locale, promo.href) : '#'} className="truncate">
              {pickLocalized(promo.text, locale)}
            </Link>
            <button
              type="button"
              onClick={() => setPromoDismissed(true)}
              aria-label={dict.common.close}
              className="absolute right-4 flex h-5 w-5 items-center justify-center opacity-80 transition-opacity hover:opacity-100"
            >
              <CloseIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Header element: transition only background & shadow, NOT color */}
      <header
        className={cn(
          'fixed inset-x-0 z-[100] w-full transition-[background-color,box-shadow,top] duration-300 ease-in-out',
          showPromo ? (scrolled ? 'top-0' : 'top-9') : 'top-0',
          transparent
            ? 'bg-transparent text-white'
            : 'bg-white text-ink shadow-[0_4px_20px_rgba(0,0,0,0.08)] backdrop-blur-md'
        )}
      >
        {/* Top brand gradient for home hero transparency */}
        <div
          className={cn(
            'pointer-events-none absolute inset-x-0 top-0 z-[1] h-[160px] bg-gradient-to-b from-[#004d43]/20 via-[#004d43]/30 to-transparent transition-opacity duration-300',
            transparent ? 'opacity-100' : 'opacity-0'
          )}
          aria-hidden
        />

        <div className="relative z-[2] mx-auto w-full max-w-[1292px] px-4">
          {/* Row 1 - Logo, Search, Navigation Icons */}
          <div className="flex h-[60px] items-center justify-between gap-4 xl:h-[75px]">
            <Link href={localePath(locale, '/')} aria-label={dict.meta.siteName} className="shrink-0">
              <Wordmark tone={transparent ? 'light' : 'brand'} priority className="h-10 xl:h-12" />
            </Link>

            <form
              onSubmit={submitSearch}
              className={cn(
                'mx-auto hidden h-[46px] w-full max-w-[355px] items-center gap-3 rounded-full px-5 transition-colors duration-200 xl:flex',
                transparent
                  ? 'bg-white/20 text-white backdrop-blur-md'
                  : 'bg-surface-soft text-ink'
              )}
              role="search"
            >
              <input
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder={dict.nav.searchPlaceholder}
                aria-label={dict.nav.search}
                className={cn(
                  'min-w-0 flex-1 border-0 bg-transparent text-[13px] outline-none',
                  transparent ? 'placeholder:text-white/80' : 'placeholder:text-ink-faint'
                )}
              />
              <button type="submit" aria-label={dict.nav.search} className="shrink-0">
                <SearchIcon className="h-[18px] w-[18px]" />
              </button>
            </form>

            <nav className="flex items-center gap-1" aria-label={dict.nav.menu}>
              <button
                type="button"
                onClick={() => toggleSearch()}
                aria-label={dict.nav.search}
                className="flex h-10 w-10 items-center justify-center xl:hidden"
              >
                <SearchIcon className="h-5 w-5" />
              </button>

              <Link
                href={localePath(locale, isAuthenticated ? '/account' : '/login')}
                aria-label={dict.nav.account}
                className="flex h-[50px] w-[50px] items-center justify-center transition-opacity hover:opacity-70"
              >
                <UserIcon className="h-[22px] w-[22px]" />
              </Link>

              <Link
                href={localePath(locale, '/cart')}
                aria-label={dict.nav.cart}
                className="relative flex h-10 w-10 items-center justify-center transition-opacity hover:opacity-70"
              >
                <BagIcon className="h-[22px] w-[22px]" />
                <span
                  className={cn(
                    'absolute right-0.5 top-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full px-1',
                    'text-[10px] font-medium leading-none text-white',
                    cartCount > 0 ? 'bg-danger' : 'bg-danger/70'
                  )}
                >
                  {cartCount}
                </span>
              </Link>

              <button
                type="button"
                onClick={() => toggleMobileNav(true)}
                aria-label={dict.nav.menu}
                className="flex h-10 w-10 items-center justify-center xl:hidden"
              >
                <MenuIcon className="h-5 w-5" />
              </button>
            </nav>
          </div>

          {/* Row 2 - Menu links */}
          <nav
            className="relative hidden h-[44px] items-center justify-between gap-1 text-[16px] xl:flex"
            aria-label={dict.nav.allMenu}
          >
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => toggleMega()}
                aria-expanded={megaOpen}
                aria-label={dict.nav.allMenu}
                className="flex h-10 w-10 items-center justify-center transition-opacity hover:opacity-70"
              >
                {megaOpen ? <CloseIcon className="h-[22px] w-[22px]" /> : <MenuIcon className="h-[22px] w-[22px]" />}
              </button>

              <ul className="flex items-center">
                {quickLinks.map((link) => {
                  const [base] = link.href.split('?');
                  const active = pathname.startsWith(localePath(locale, base));
                  return (
                    <li key={link.href}>
                      <Link
                        href={localePath(locale, link.href)}
                        className={cn(
                          'inline-block whitespace-nowrap px-3.5 py-1.5 font-medium transition-opacity hover:opacity-70',
                          active && !transparent && 'text-brand'
                        )}
                      >
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div>
              <LanguageSwitcher locale={locale} transparent={transparent} label={dict.nav.language} />
            </div>

            <MegaMenu
              open={megaOpen}
              locale={locale}
              dict={dict}
              categories={categories ?? []}
              onClose={() => toggleMega(false)}
            />
          </nav>
        </div>

        {/* Mobile Search Input Popup */}
        {searchOpen && (
          <div className="absolute inset-x-0 top-full z-[101] px-3 pb-3 xl:hidden">
            <form
              onSubmit={submitSearch}
              className={cn(
                'flex h-12 w-full items-center gap-3 rounded-full px-5',
                transparent ? 'bg-black/60 text-white backdrop-blur-md' : 'bg-surface-soft text-ink'
              )}
              role="search"
            >
              <input
                autoFocus
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder={dict.nav.searchPlaceholder}
                aria-label={dict.nav.search}
                className={cn(
                  'min-w-0 flex-1 border-0 bg-transparent text-[13px] outline-none',
                  transparent ? 'placeholder:text-white/80' : 'placeholder:text-ink-faint'
                )}
              />
              <button type="submit" aria-label={dict.nav.search}>
                <SearchIcon className="h-[18px] w-[18px]" />
              </button>
            </form>
          </div>
        )}
      </header>

      {/* Spacer */}
      {!isHome && <div className="h-[104px] xl:h-[119px]" />}

      <MobileNav locale={locale} dict={dict} categories={categories ?? []} />
    </>
  );
}