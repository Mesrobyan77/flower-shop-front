'use client';

import { useState } from 'react';
import { cn, formatPrice } from '@/lib/utils';
import { pickLocalized, type Dictionary, type Locale } from '@/lib/i18n';
import { useAppConfig } from '@/lib/hooks/useCatalog';
import { useSession } from '@/lib/hooks/useAuth';
import { useToggleWishlist, useWishlist } from '@/lib/hooks/useAccount';
import { useUiStore } from '@/store/ui';
import { HeartIcon, ShareIcon } from '@/components/ui/Icons';
import type { Product } from '@/types';

/**
 * Reference right rail carried a grade ladder (일반 / 씨앗 / … / 나무) showing the
 * extra discount and points each tier earns. Ours reads the same ladder from the
 * API config so backend and storefront can never drift apart.
 */
export function MemberGradeLadder({ dict }: { dict: Dictionary }) {
  const { data: config } = useAppConfig();
  const [open, setOpen] = useState(false);

  if (!config?.grades?.length) return null;

  const top = config.grades[config.grades.length - 1];

  return (
    <div className="rounded-tile border border-line">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="text-[12.5px] font-semibold text-ink-strong">{dict.product.memberBenefit}</span>
        <span className="text-[12px] text-brand">
          {Math.round(top.discountRate * 100)}% · {Math.round(top.pointRate * 100)}%
        </span>
      </button>

      {open && (
        <div className="animate-slide-down border-t border-line-soft px-4 py-3">
          <ul className="flex flex-col gap-2">
            {config.grades.map((grade) => (
              <li key={grade.key} className="flex items-center justify-between text-[12px]">
                <span className="text-ink-muted">
                  {dict.grades[grade.key as keyof Dictionary['grades']] ?? grade.key}
                </span>
                <span className="flex items-center gap-3">
                  <span className={cn(grade.discountRate > 0 ? 'text-brand' : 'text-ink-faint')}>
                    {grade.discountRate > 0 ? `+${Math.round(grade.discountRate * 100)}%` : '-'}
                  </span>
                  <span className="text-ink-faint">
                    {Math.round(grade.pointRate * 100)}% {dict.product.pointsEarn}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] leading-relaxed text-ink-faint">
            {dict.account.totalSpend}: {formatPrice(config.grades[1]?.minSpend ?? 0)} +
          </p>
        </div>
      )}
    </div>
  );
}

/** Wishlist toggle plus native share, mirroring the reference share/찜 row. */
export function ProductShareRow({
  product,
  dict,
  locale,
}: {
  product: Product;
  dict: Dictionary;
  locale: Locale;
}) {
  const { isAuthenticated } = useSession();
  const { data: wishlist } = useWishlist();
  const toggle = useToggleWishlist();
  const notify = useUiStore((s) => s.notify);

  const inWishlist = wishlist?.some((item) => item.id === product.id) ?? false;

  const share = async () => {
    const url = typeof window === 'undefined' ? '' : window.location.href;
    const title = pickLocalized(product.name, locale);

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // user dismissed the sheet - fall through to clipboard
      }
    }
    await navigator.clipboard?.writeText(url);
    notify(dict.common.copied, 'info');
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => {
          if (!isAuthenticated) {
            notify(dict.auth.loginTitle, 'info');
            return;
          }
          toggle.mutate(product.id);
          notify(inWishlist ? dict.product.wishlistRemoved : dict.product.wishlistAdded, 'success');
        }}
        className={cn(
          'flex h-10 items-center gap-2 rounded-card border px-4 text-[12.5px] transition-colors duration-fast',
          inWishlist ? 'border-brand text-brand' : 'border-line text-ink-muted hover:border-brand hover:text-brand',
        )}
        aria-pressed={inWishlist}
      >
        <HeartIcon className="h-4 w-4" filled={inWishlist} />
        {dict.product.wishlist}
      </button>

      <button
        type="button"
        onClick={share}
        className="flex h-10 items-center gap-2 rounded-card border border-line px-4 text-[12.5px] text-ink-muted transition-colors duration-fast hover:border-brand hover:text-brand"
      >
        <ShareIcon className="h-4 w-4" />
        {dict.product.share}
      </button>
    </div>
  );
}
