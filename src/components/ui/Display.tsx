import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { ProductBadge } from '@/types';
import { ChevronIcon } from './Icons';

/* --------------------------------- badges -------------------------------- */

const BADGE_TONE: Record<ProductBadge, string> = {
  new: 'bg-brand text-white',
  best: 'bg-ink-strong text-white',
  sale: 'bg-danger-soft text-white',
  today: 'bg-olive text-white',
  subscription_only: 'bg-gold text-ink-strong',
};

const BADGE_LABEL: Record<ProductBadge, Record<string, string>> = {
  new: { hy: 'ՆՈՐ', en: 'NEW', ru: 'НОВОЕ' },
  best: { hy: 'ՀԻԹ', en: 'BEST', ru: 'ХИТ' },
  sale: { hy: 'ԶԵՂՉ', en: 'SALE', ru: 'СКИДКА' },
  today: { hy: 'ԱՅՍՕՐ', en: 'TODAY', ru: 'СЕГОДНЯ' },
  subscription_only: { hy: 'ԲԱԺԱՆՈՐԴ', en: 'PLAN', ru: 'ПОДПИСКА' },
};

export function ProductBadges({ badges, locale }: { badges: ProductBadge[]; locale: string }) {
  if (!badges?.length) return null;
  return (
    <div className="pointer-events-none absolute left-2 top-2 flex flex-wrap gap-1">
      {badges.slice(0, 2).map((badge) => (
        <span
          key={badge}
          className={cn('rounded-sm px-1.5 py-0.5 text-[10px] font-semibold tracking-wide', BADGE_TONE[badge])}
        >
          {BADGE_LABEL[badge][locale] ?? BADGE_LABEL[badge].en}
        </span>
      ))}
    </div>
  );
}

export function Tag({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: 'neutral' | 'brand' | 'olive' | 'warn' | 'danger';
  className?: string;
}) {
  const tones = {
    neutral: 'border-line bg-white text-ink-muted',
    brand: 'border-brand/30 bg-brand-50 text-brand-700',
    olive: 'border-olive/30 bg-olive/10 text-olive-dark',
    warn: 'border-gold/40 bg-gold-wash text-ink',
    danger: 'border-danger-soft/30 bg-danger-soft/10 text-danger-soft',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-pill border px-2 py-0.5 text-[11px] leading-none',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ----------------------------- section heading ---------------------------- */

export function SectionHeading({
  title,
  subtitle,
  href,
  moreLabel,
  align = 'left',
  className,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  moreLabel?: string;
  align?: 'left' | 'center';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'mb-6 flex flex-wrap items-end gap-x-4 gap-y-2 lg:mb-8',
        align === 'center' ? 'flex-col items-center text-center' : 'justify-between',
        className,
      )}
    >
      <div className={cn(align === 'center' && 'flex flex-col items-center')}>
        <h2 className="min-w-0 text-[19px] font-semibold leading-tight tracking-tight text-ink-strong lg:text-[24px]">
          {title}
        </h2>
        {subtitle && <p className="mt-1.5 text-[12px] text-ink-soft lg:text-[13px]">{subtitle}</p>}
      </div>

      {href && (
        <Link
          href={href}
          className="group inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[12px] text-ink-muted transition-colors duration-fast hover:text-brand lg:text-[13px]"
        >
          {moreLabel}
          <ChevronIcon className="h-3 w-3 transition-transform duration-fast group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

/* ------------------------------- breadcrumb ------------------------------- */

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[11px] text-ink-soft">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="flex items-center gap-1.5">
          {item.href ? (
            <Link href={item.href} className="transition-colors duration-fast hover:text-brand">
              {item.label}
            </Link>
          ) : (
            <span className="text-ink">{item.label}</span>
          )}
          {index < items.length - 1 && <ChevronIcon className="h-2.5 w-2.5 text-line-strong" />}
        </span>
      ))}
    </nav>
  );
}

/* --------------------------------- price --------------------------------- */

export function Price({
  amount,
  compareAt,
  symbol = '֏',
  size = 'md',
  className,
}: {
  amount: number;
  compareAt?: number;
  symbol?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const sizes = {
    sm: 'text-[13px]',
    md: 'text-[15px]',
    lg: 'text-[19px]',
    xl: 'text-[26px]',
  };
  const hasDiscount = compareAt && compareAt > amount;
  const percent = hasDiscount ? Math.round(((compareAt - amount) / compareAt) * 100) : 0;

  return (
    <span className={cn('flex flex-wrap items-baseline gap-x-2 gap-y-1', className)}>
      {hasDiscount && <span className="text-[13px] font-semibold text-danger-soft">{percent}%</span>}
      <span className={cn('font-bold tracking-tight text-brand', sizes[size])}>
        {Math.round(amount).toLocaleString('en-US')}
        <span className="ml-0.5 text-[0.72em] font-medium">{symbol}</span>
      </span>
      {hasDiscount && (
        <s className="text-[12px] text-ink-faint">
          {Math.round(compareAt).toLocaleString('en-US')}
          {symbol}
        </s>
      )}
    </span>
  );
}

/* ---------------------------------- tabs --------------------------------- */

export function Tabs({
  items,
  active,
  onChange,
  className,
}: {
  items: { key: string; label: string; count?: number }[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex overflow-x-auto border-b border-line no-scrollbar', className)} role="tablist">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          role="tab"
          aria-selected={active === item.key}
          onClick={() => onChange(item.key)}
          className={cn(
            'relative shrink-0 whitespace-nowrap px-4 py-3.5 text-[13px] transition-colors duration-fast lg:px-8',
            active === item.key ? 'font-semibold text-ink-strong' : 'text-ink-soft hover:text-ink',
          )}
        >
          {item.label}
          {item.count !== undefined && item.count > 0 && (
            <span className={cn('ml-1', active === item.key ? 'text-brand' : 'text-ink-faint')}>{item.count}</span>
          )}
          {active === item.key && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-ink-strong" />}
        </button>
      ))}
    </div>
  );
}
