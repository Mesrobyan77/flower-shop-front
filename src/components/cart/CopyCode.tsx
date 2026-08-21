'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

/** Order number with a one-tap copy, like the reference's bank-account copy button. */
export function CopyCode({
  code,
  copyLabel,
  copiedLabel,
}: {
  code: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard permission denied - the code stays selectable on screen
    }
  };

  return (
    <div className="mt-1.5 flex items-center justify-center gap-3">
      <span className="font-display text-[20px] font-bold tracking-wide text-ink-strong">{code}</span>
      <button
        type="button"
        onClick={copy}
        className={cn(
          'rounded-card border px-2.5 py-1 text-[11px] transition-colors duration-fast',
          copied ? 'border-brand text-brand' : 'border-line text-ink-muted hover:border-brand hover:text-brand',
        )}
      >
        {copied ? copiedLabel : copyLabel}
      </button>
    </div>
  );
}
