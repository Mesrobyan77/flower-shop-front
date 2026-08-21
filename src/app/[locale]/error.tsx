'use client';

import { useEffect } from 'react';

export default function LocaleError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="rail flex flex-col items-center justify-center gap-4 py-28 text-center">
      <h1 className="text-[18px] font-semibold text-ink-strong">Something went wrong</h1>
      <p className="max-w-md text-[13px] text-ink-soft">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-2 inline-flex h-11 items-center rounded-card border border-line-strong px-6 text-[13px] font-medium transition-colors duration-fast hover:border-brand hover:text-brand"
      >
        Retry
      </button>
    </div>
  );
}
