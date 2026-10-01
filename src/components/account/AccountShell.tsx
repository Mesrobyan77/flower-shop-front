'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { cn, formatPrice } from '@/lib/utils';
import { localePath, type Dictionary, type Locale } from '@/lib/i18n';
import { useLogout, useSession } from '@/lib/hooks/useAuth';
import { useAccountSummary } from '@/lib/hooks/useAccount';
import { Skeleton } from '@/components/ui/Feedback';

/**
 * Guards every /account route and paints the reference "my page" chrome:
 * grade + points summary on top, section nav on the left.
 */
export function AccountShell({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, hydrated, booting } = useSession();
  const { data: summary } = useAccountSummary();
  const logout = useLogout(locale);

  useEffect(() => {
    if (hydrated && !booting && !isAuthenticated) {
      router.replace(`${localePath(locale, '/login')}?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [hydrated, booting, isAuthenticated, locale, pathname, router]);

  if (!hydrated || booting || !isAuthenticated) {
    return (
      <div className="rail py-10">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const links = [
    { href: '/account', label: dict.account.dashboard },
    { href: '/account/orders', label: dict.account.orders },
    { href: '/account/addresses', label: dict.account.addresses },
    { href: '/account/wishlist', label: dict.account.wishlist },
    { href: '/account/inquiries', label: dict.account.inquiries },
    { href: '/account/subscriptions', label: dict.account.subscriptions },
    { href: '/account/profile', label: dict.account.profile },
  ];

  const gradeKey = (summary?.grade.key ?? user?.grade ?? 'general') as keyof Dictionary['grades'];

  return (
    <div className="rail py-6 lg:py-10">
      <header className="flex flex-col gap-4 rounded-tile border border-line bg-surface-soft px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-7">
        <div>
          <p className="text-[12px] text-ink-soft">{dict.account.title}</p>
          <p className="mt-0.5 text-[19px] font-semibold text-ink-strong">{user?.name}</p>
          <p className="text-[12px] text-ink-soft">{user?.email}</p>
        </div>

        <dl className="grid grid-cols-3 gap-4 lg:gap-8">
          <div>
            <dt className="text-[11px] text-ink-soft">{dict.account.grade}</dt>
            <dd className="mt-0.5 text-[14px] font-semibold text-brand">{dict.grades[gradeKey]}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-ink-soft">{dict.account.points}</dt>
            <dd className="mt-0.5 text-[14px] font-semibold text-ink-strong">
              {formatPrice(summary?.points ?? user?.points ?? 0)}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] text-ink-soft">{dict.account.activeOrders}</dt>
            <dd className="mt-0.5 text-[14px] font-semibold text-ink-strong">{summary?.activeCount ?? 0}</dd>
          </div>
        </dl>
      </header>

      <div className="mt-6 grid gap-8 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-10">
        <nav aria-label={dict.account.title}>
          <ul className="flex gap-1 overflow-x-auto no-scrollbar lg:flex-col lg:gap-0.5 lg:overflow-visible">
            {links.map((link) => {
              const target = localePath(locale, link.href);
              const active = link.href === '/account' ? pathname === target : pathname.startsWith(target);

              return (
                <li key={link.href} className="shrink-0">
                  <Link
                    href={target}
                    className={cn(
                      'block whitespace-nowrap rounded-card px-4 py-2.5 text-[13px] transition-colors duration-fast',
                      active ? 'bg-ink-strong font-medium text-white' : 'text-ink-muted hover:bg-surface-soft',
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
            <li className="shrink-0">
              <button
                type="button"
                onClick={() => logout.mutate()}
                className="block w-full whitespace-nowrap rounded-card px-4 py-2.5 text-left text-[13px] text-ink-faint transition-colors duration-fast hover:bg-surface-soft hover:text-danger-soft"
              >
                {dict.auth.logout}
              </button>
            </li>
          </ul>
        </nav>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
