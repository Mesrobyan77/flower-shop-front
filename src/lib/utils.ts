import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Currency renders like the reference did for KRW: amount first, symbol after. */
export function formatPrice(amount: number, symbol = '\u058F', locale = 'hy-AM'): string {
  const value = Math.round(amount || 0).toLocaleString(locale === 'hy-AM' ? 'en-US' : locale);
  return `${value} ${symbol}`;
}

export function formatNumber(value: number, locale = 'en-US'): string {
  return Math.round(value || 0).toLocaleString(locale);
}

const DATE_LOCALES: Record<string, string> = { hy: 'hy-AM', en: 'en-GB', ru: 'ru-RU' };

export function formatDate(value: string | Date | undefined, locale = 'hy', withTime = false): string {
  if (!value) return '';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString(DATE_LOCALES[locale] ?? 'hy-AM', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

export function formatDateLong(value: string | Date | undefined, locale = 'hy'): string {
  if (!value) return '';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(DATE_LOCALES[locale] ?? 'hy-AM', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function discountPercent(price: number, compareAt?: number): number | null {
  if (!compareAt || compareAt <= price) return null;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function range(from: number, to: number): number[] {
  return Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);
}

/** Compact pagination window: 1 … 4 5 [6] 7 8 … 20 */
export function paginationWindow(current: number, total: number, span = 2): (number | 'gap')[] {
  if (total <= 1) return [1];
  const out: (number | 'gap')[] = [];
  const start = Math.max(1, current - span);
  const end = Math.min(total, current + span);

  if (start > 1) {
    out.push(1);
    if (start > 2) out.push('gap');
  }
  for (let i = start; i <= end; i += 1) out.push(i);
  if (end < total) {
    if (end < total - 1) out.push('gap');
    out.push(total);
  }
  return out;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/** Masks a display name the way commerce sites hide reviewer identities. */
export function maskName(name: string): string {
  if (!name) return '';
  if (name.length <= 2) return `${name[0]}*`;
  return `${name[0]}${'*'.repeat(Math.max(1, name.length - 2))}${name[name.length - 1]}`;
}
