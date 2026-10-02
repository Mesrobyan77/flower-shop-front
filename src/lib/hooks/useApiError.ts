'use client';

import { useCallback } from 'react';
import { useParams } from 'next/navigation';
import { getLocalizedApiError } from '@/lib/api/errors';
import { normalizeLocale } from '@/lib/i18n';
import { useUiStore } from '@/store/ui';

/**
 * Single entry point for request errors shown as toasts: reads the active
 * locale from the route (never the browser language) and maps the error
 * through the shared localizer.
 */
export function useApiError() {
  const params = useParams();
  const notify = useUiStore((s) => s.notify);
  const raw = params?.locale;
  const locale = normalizeLocale(typeof raw === 'string' ? raw : undefined);

  return useCallback((error: unknown) => notify(getLocalizedApiError(error, locale), 'error'), [notify, locale]);
}
