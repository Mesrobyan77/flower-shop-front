'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { defaultLocale, getDictionary, localePath } from '@/lib/i18n';
import { useLogout, useSession } from '@/lib/hooks/useAuth';
import { Skeleton } from '@/components/ui/Feedback';
import { MenuIcon, CloseIcon } from '@/components/ui/Icons';
import { Wordmark } from '@/components/layout/Wordmark';

const NAV = [
  { href: '/admin', key: 'dashboard' as const, exact: true },
  { href: '/admin/orders', key: 'orders' as const },
  { href: '/admin/products', key: 'products' as const },
  { href: '/admin/categories', key: 'categories' as const },
  { href: '/admin/collections', key: 'collections' as const },
  { href: '/admin/users', key: 'users' as const },
  { href: '/admin/reviews', key: 'reviews' as const },
  { href: '/admin/inquiries', key: 'inquiries' as const },
  { href: '/admin/posts', key: 'posts' as const },
  { href: '/admin/media', key: 'media' as const },
  { href: '/admin/settings', key: 'settings' as const },
];

/**
 * Admin runs outside the locale-prefixed storefront and is gated on role, not
 * just on being signed in: a normal user hitting /admin is bounced home.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const dict = getDictionary(defaultLocale);
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, hydrated, booting } = useSession();
  const logout = useLogout(defaultLocale);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (!hydrated || booting) return;
    if (!isAuthenticated) {
      router.replace(`${localePath(defaultLocale, '/login')}?redirect=/admin`);
      return;
    }
    if (user?.role !== 'admin') router.replace(localePath(defaultLocale, '/'));
  }, [hydrated, booting, isAuthenticated, user?.role, router]);

  useEffect(() => setNavOpen(false), [pathname]);

  if (!hydrated || booting || !isAuthenticated) {
    return (
      <div className="p-8">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-center">
        <p className="text-[14px] text-ink-muted">{dict.admin.noAccess}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-surface-soft">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-[120] flex w-[240px] flex-col border-r border-line bg-white transition-transform duration-base lg:static lg:translate-x-0',
          navOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-line px-5">
          <Link href="/admin">
            <Wordmark tone="brand" className="h-10" />
          </Link>
          <button
            type="button"
            onClick={() => setNavOpen(false)}
            className="text-ink-soft lg:hidden"
            aria-label={dict.common.close}
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="flex flex-col gap-0.5">
            {NAV.map((item) => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'block rounded-card px-3 py-2.5 text-[13px] transition-colors duration-fast',
                      active ? 'bg-brand text-white' : 'text-ink-muted hover:bg-surface-soft hover:text-ink',
                    )}
                  >
                    {dict.admin[item.key]}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-line p-3">
          <Link
            href={localePath(defaultLocale, '/')}
            className="block rounded-card px-3 py-2 text-[12px] text-ink-muted hover:bg-surface-soft"
          >
            {dict.admin.backToSite}
          </Link>
          <button
            type="button"
            onClick={() => logout.mutate()}
            className="mt-1 block w-full rounded-card px-3 py-2 text-left text-[12px] text-ink-faint hover:bg-surface-soft hover:text-danger-soft"
          >
            {dict.auth.logout}
          </button>
        </div>
      </aside>

      {navOpen && (
        <div className="fixed inset-0 z-[110] bg-black/40 lg:hidden" onClick={() => setNavOpen(false)} aria-hidden />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-[100] flex h-16 items-center gap-3 border-b border-line bg-white px-4 lg:px-8">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            className="text-ink lg:hidden"
            aria-label={dict.nav.menu}
          >
            <MenuIcon className="h-5 w-5" />
          </button>
          <h1 className="text-[15px] font-semibold text-ink-strong">{dict.admin.title}</h1>
          <span className="ml-auto text-[12px] text-ink-soft">{user?.email}</span>
        </header>

        <main className="min-w-0 flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

/* --------------------------- shared admin pieces --------------------------- */

export function AdminPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-[19px] font-semibold tracking-tight text-ink-strong">{title}</h2>
        {description && <p className="mt-1 text-[12.5px] text-ink-soft">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function AdminCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-tile border border-line bg-white p-5', className)}>{children}</div>;
}

export function AdminTable({
  head,
  children,
}: {
  head: string[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-tile border border-line bg-white">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead>
          <tr className="border-b border-line bg-surface-soft">
            {head.map((label) => (
              <th key={label} className="whitespace-nowrap px-4 py-3 text-[11.5px] font-semibold text-ink-muted">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line-soft">{children}</tbody>
      </table>
    </div>
  );
}
