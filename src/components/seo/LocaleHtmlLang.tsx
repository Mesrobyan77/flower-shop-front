'use client';

import { useEffect } from 'react';
import { localeHtmlLang, type Locale } from '@/lib/i18n';

/**
 * The root layout ships one static <html lang>; this syncs it to the active
 * locale after hydration (the pre-hydration HTML keeps the default value).
 */
export function LocaleHtmlLang({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.documentElement.lang = localeHtmlLang[locale];
  }, [locale]);

  return null;
}
