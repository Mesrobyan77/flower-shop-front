'use client';

import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/lib/utils';

const FIELD =
  'w-full rounded-card border border-line bg-white px-3 text-[13px] text-ink placeholder:text-ink-faint ' +
  'transition-colors duration-fast outline-none focus:border-brand disabled:bg-surface-soft disabled:text-ink-soft';

interface FieldShellProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
  htmlFor?: string;
}

export function Field({ label, hint, error, required, className, children, htmlFor }: FieldShellProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-[12px] font-medium text-ink-muted">
          {label}
          {required && <span className="ml-1 text-danger">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-[11px] text-danger-soft">{error}</p>
      ) : hint ? (
        <p className="text-[11px] text-ink-faint">{hint}</p>
      ) : null}
    </div>
  );
}

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, className, wrapperClassName, required, id, ...rest },
  ref,
) {
  return (
    <Field label={label} hint={hint} error={error} required={required} className={wrapperClassName} htmlFor={id}>
      <input
        ref={ref}
        id={id}
        aria-invalid={Boolean(error)}
        className={cn(FIELD, 'h-11', error && 'border-danger-soft', className)}
        {...rest}
      />
    </Field>
  );
});

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className, wrapperClassName, required, id, ...rest },
  ref,
) {
  return (
    <Field label={label} hint={hint} error={error} required={required} className={wrapperClassName} htmlFor={id}>
      <textarea
        ref={ref}
        id={id}
        aria-invalid={Boolean(error)}
        className={cn(FIELD, 'min-h-24 resize-y py-2.5 leading-relaxed', error && 'border-danger-soft', className)}
        {...rest}
      />
    </Field>
  );
});

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, className, wrapperClassName, required, id, children, ...rest },
  ref,
) {
  return (
    <Field label={label} hint={hint} error={error} required={required} className={wrapperClassName} htmlFor={id}>
      <div className="relative">
        <select
          ref={ref}
          id={id}
          aria-invalid={Boolean(error)}
          className={cn(FIELD, 'h-11 appearance-none pr-9', error && 'border-danger-soft', className)}
          {...rest}
        >
          {children}
        </select>
        <svg
          className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-ink-soft"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    </Field>
  );
});

export function Checkbox({
  label,
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label?: ReactNode }) {
  return (
    <label className={cn('flex cursor-pointer items-start gap-2 text-[13px] text-ink', className)}>
      <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-brand" {...rest} />
      {label && <span className="leading-snug">{label}</span>}
    </label>
  );
}

export function Radio({
  label,
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label?: ReactNode }) {
  return (
    <label className={cn('flex cursor-pointer items-start gap-2 text-[13px] text-ink', className)}>
      <input type="radio" className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-brand" {...rest} />
      {label && <span className="leading-snug">{label}</span>}
    </label>
  );
}
