'use client';

import Link from 'next/link';
import { forwardRef, type ButtonHTMLAttributes, type ComponentProps, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'dark' | 'danger' | 'pill';
type Size = 'sm' | 'md' | 'lg' | 'xl';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-600 active:bg-brand-700 disabled:bg-brand-200',
  secondary: 'bg-olive text-white hover:bg-olive-dark active:bg-olive-dark',
  outline: 'border border-line-strong bg-white text-ink hover:border-brand hover:text-brand',
  ghost: 'bg-transparent text-ink hover:bg-surface-soft',
  dark: 'bg-ink-strong text-white hover:bg-ink',
  danger: 'bg-danger-soft text-white hover:brightness-95',
  pill: 'rounded-pill border border-line-strong bg-white text-ink hover:border-brand hover:text-brand',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-[12px]',
  md: 'h-10 px-4 text-[13px]',
  lg: 'h-12 px-6 text-[14px]',
  xl: 'h-14 px-8 text-[15px]',
};

interface BaseProps {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
}

function classes({ variant = 'primary', size = 'md', fullWidth, className }: BaseProps) {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-card font-medium leading-none',
    'transition-colors duration-fast disabled:cursor-not-allowed disabled:opacity-60',
    VARIANTS[variant],
    SIZES[size],
    fullWidth && 'w-full',
    className,
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent',
        className,
      )}
      aria-hidden
    />
  );
}

export type ButtonProps = BaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean; icon?: ReactNode };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, fullWidth, loading, icon, className, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={classes({ variant, size, fullWidth, className })}
      {...rest}
    >
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  );
});

export type ButtonLinkProps = BaseProps & { icon?: ReactNode } & ComponentProps<typeof Link>;

export function ButtonLink({ variant, size, fullWidth, icon, className, children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={classes({ variant, size, fullWidth, className })} {...rest}>
      {icon}
      {children}
    </Link>
  );
}
