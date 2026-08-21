'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

/** Locks body scroll while any overlay is mounted. */
function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);
}

function useEscape(active: boolean, onClose: () => void) {
  useEffect(() => {
    if (!active) return undefined;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [active, onClose]);
}

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  footer?: ReactNode;
}

const SIZE: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-3xl',
};

export function Modal({ open, onClose, title, description, size = 'md', children, footer }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useScrollLock(open);
  useEscape(open, onClose);

  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-end justify-center p-0 lg:items-center lg:p-6">
      <div
        className="absolute inset-0 animate-fade-in bg-black/45"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          'relative flex max-h-[92vh] w-full flex-col overflow-hidden bg-white outline-none',
          'animate-scale-in rounded-t-2xl lg:rounded-tile',
          SIZE[size],
        )}
      >
        {(title || description) && (
          <header className="flex items-start justify-between gap-4 border-b border-line-soft px-5 py-4">
            <div>
              {title && <h2 className="text-[15px] font-semibold text-ink-strong">{title}</h2>}
              {description && <p className="mt-1 text-[12px] text-ink-soft">{description}</p>}
            </div>
            <CloseButton onClick={onClose} />
          </header>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>

        {footer && <footer className="border-t border-line-soft px-5 py-4">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}

export function Drawer({
  open,
  onClose,
  side = 'right',
  title,
  children,
  widthClass = 'max-w-md',
}: {
  open: boolean;
  onClose: () => void;
  side?: 'left' | 'right';
  title?: string;
  children: ReactNode;
  widthClass?: string;
}) {
  useScrollLock(open);
  useEscape(open, onClose);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[150]">
      <div className="absolute inset-0 animate-fade-in bg-black/45" onClick={onClose} aria-hidden />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'absolute inset-y-0 flex w-full flex-col bg-white shadow-glass',
          widthClass,
          side === 'right' ? 'right-0' : 'left-0',
        )}
        style={{ animation: 'fade-in 200ms ease-out both' }}
      >
        <header className="flex items-center justify-between border-b border-line-soft px-5 py-4">
          <h2 className="text-[15px] font-semibold text-ink-strong">{title}</h2>
          <CloseButton onClick={onClose} />
        </header>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </aside>
    </div>,
    document.body,
  );
}

export function CloseButton({ onClick, label = 'Close' }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-soft transition-colors duration-fast hover:bg-surface-soft hover:text-ink"
    >
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden>
        <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </button>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  tone = 'default',
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel: string;
  tone?: 'default' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title} size="sm">
      {message && <p className="text-[13px] leading-relaxed text-ink-muted">{message}</p>}
      <div className="mt-6 flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="h-11 flex-1 rounded-card border border-line-strong bg-white text-[13px] font-medium transition-colors duration-fast hover:border-ink"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={cn(
            'h-11 flex-1 rounded-card text-[13px] font-medium text-white transition-colors duration-fast',
            tone === 'danger' ? 'bg-danger-soft hover:brightness-95' : 'bg-brand hover:bg-brand-600',
          )}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
