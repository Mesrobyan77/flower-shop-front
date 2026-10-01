'use client';

import type { PaymentProvider, PaymentStartResult } from '@/types';

export interface PendingPaymentHint {
  token: string;
  orderCode: string;
  provider: PaymentProvider;
  savedAt: number;
}

const STORAGE_KEY = 'xf-payment-return';
const MAX_AGE_MS = 2 * 60 * 60 * 1000;

/**
 * Idram returns the browser to a fixed registered URL without query parameters,
 * so the return page needs a locally stored hint to find the payment again.
 */
export function savePendingPayment(hint: Omit<PendingPaymentHint, 'savedAt'>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...hint, savedAt: Date.now() }));
  } catch {
    // Private mode or a full quota must not break the redirect to the provider.
  }
}

export function readPendingPayment(): PendingPaymentHint | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingPaymentHint;
    if (!parsed?.token || typeof parsed.savedAt !== 'number' || Date.now() - parsed.savedAt > MAX_AGE_MS) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingPayment(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear when storage is unavailable.
  }
}

/** Navigates the browser to the provider-hosted payment page. */
export function redirectToProvider(start: PaymentStartResult): void {
  if (start.kind === 'form' && start.action && start.fields) {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = start.action;
    form.style.display = 'none';
    for (const [name, value] of Object.entries(start.fields)) {
      const field = document.createElement('input');
      field.type = 'hidden';
      field.name = name;
      field.value = value;
      form.appendChild(field);
    }
    document.body.appendChild(form);
    form.submit();
    return;
  }
  if (start.kind === 'url' && start.url) {
    window.location.assign(start.url);
  }
}
