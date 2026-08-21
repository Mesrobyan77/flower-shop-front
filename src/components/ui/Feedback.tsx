'use client';

import { useEffect } from 'react';
import { cn, paginationWindow } from '@/lib/utils';
import { useUiStore } from '@/store/ui';
import type { ReactNode } from 'react';

/* ------------------------------- skeletons ------------------------------- */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-card', className)} aria-hidden />;
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="aspect-square w-full rounded-tile" />
      <Skeleton className="h-3 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-3 2xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/* ------------------------------ empty / error ----------------------------- */

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-tile border border-dashed border-line px-6 py-16 text-center">
      {icon ?? (
        <svg className="h-10 w-10 text-line-strong" viewBox="0 0 40 40" fill="none" aria-hidden>
          <circle cx="20" cy="20" r="15" stroke="currentColor" strokeWidth="1.5" />
          <path d="M14 23c1.8 1.6 3.9 2.4 6 2.4s4.2-.8 6-2.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="15.5" cy="17" r="1.4" fill="currentColor" />
          <circle cx="24.5" cy="17" r="1.4" fill="currentColor" />
        </svg>
      )}
      <p className="text-[15px] font-medium text-ink">{title}</p>
      {description && <p className="max-w-sm text-[13px] text-ink-soft">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry, retryLabel }: { message: string; onRetry?: () => void; retryLabel?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-tile border border-line bg-surface-soft px-6 py-12 text-center">
      <p className="text-[13px] text-ink-muted">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-card border border-line-strong bg-white px-4 py-2 text-[12px] font-medium transition-colors duration-fast hover:border-brand hover:text-brand"
        >
          {retryLabel ?? 'Retry'}
        </button>
      )}
    </div>
  );
}

/* -------------------------------- toasts --------------------------------- */

export function ToastHost() {
  const toast = useUiStore((s) => s.toast);
  const dismiss = useUiStore((s) => s.dismissToast);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(dismiss, 3200);
    return () => clearTimeout(timer);
  }, [toast, dismiss]);

  if (!toast) return null;

  const tone =
    toast.tone === 'error'
      ? 'bg-danger-soft text-white'
      : toast.tone === 'info'
        ? 'bg-ink-strong text-white'
        : 'bg-brand text-white';

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-[200] flex justify-center px-4"
    >
      <div className={cn('animate-fade-up rounded-pill px-5 py-3 text-[13px] shadow-glass', tone)}>{toast.message}</div>
    </div>
  );
}

/* ------------------------------- pagination ------------------------------- */

export function Pagination({
  page,
  totalPages,
  onChange,
  className,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  className?: string;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav className={cn('flex items-center justify-center gap-1 pt-10', className)} aria-label="Pagination">
      <PageButton disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
        <Chevron direction="left" />
      </PageButton>

      {paginationWindow(page, totalPages).map((item, index) =>
        item === 'gap' ? (
          <span key={`gap-${index}`} className="px-1 text-[12px] text-ink-faint">
            …
          </span>
        ) : (
          <PageButton key={item} active={item === page} onClick={() => onChange(item)} aria-current={item === page}>
            {item}
          </PageButton>
        ),
      )}

      <PageButton disabled={page >= totalPages} onClick={() => onChange(page + 1)} aria-label="Next page">
        <Chevron direction="right" />
      </PageButton>
    </nav>
  );
}

function PageButton({
  active,
  disabled,
  onClick,
  children,
  ...rest
}: {
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex h-9 min-w-9 items-center justify-center rounded-card border px-2 text-[12px] transition-colors duration-fast',
        active
          ? 'border-brand bg-brand text-white'
          : 'border-line bg-white text-ink hover:border-brand hover:text-brand',
        disabled && 'cursor-not-allowed opacity-40 hover:border-line hover:text-ink',
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

function Chevron({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg
      className={cn('h-3 w-3', direction === 'right' && 'rotate-180')}
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden
    >
      <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* --------------------------------- rating -------------------------------- */

export function Rating({ value, size = 12, className }: { value: number; size?: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} aria-label={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          width={size}
          height={size}
          viewBox="0 0 20 20"
          className={star <= Math.round(value) ? 'text-gold' : 'text-line'}
          fill="currentColor"
          aria-hidden
        >
          <path d="M10 1.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L1.6 7.7l5.8-.8z" />
        </svg>
      ))}
    </span>
  );
}
