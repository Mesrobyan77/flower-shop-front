'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDownIcon } from '@/components/ui/Icons';
import { EmptyState } from '@/components/ui/Feedback';

export interface AccordionItem {
  id: string;
  title: string;
  body: string;
  meta?: string;
}

/** FAQ and notice lists both expand in place, like the reference board rows. */
export function Accordion({ items, emptyLabel }: { items: AccordionItem[]; emptyLabel: string }) {
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);

  if (items.length === 0) return <EmptyState title={emptyLabel} />;

  return (
    <ul className="flex flex-col divide-y divide-line border-y border-line">
      {items.map((item) => {
        const expanded = open === item.id;

        return (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => setOpen(expanded ? null : item.id)}
              aria-expanded={expanded}
              className="flex w-full items-center justify-between gap-4 px-1 py-4 text-left"
            >
              <span className="flex items-center gap-2 text-[13.5px] font-medium text-ink">
                {item.meta && <span className="text-gold">{item.meta}</span>}
                {item.title}
              </span>
              <ChevronDownIcon
                className={cn(
                  'h-4 w-4 shrink-0 text-ink-soft transition-transform duration-fast',
                  expanded && 'rotate-180',
                )}
              />
            </button>

            {expanded && (
              <div className="animate-slide-down whitespace-pre-line px-1 pb-5 text-[13px] leading-[1.9] text-ink-muted">
                {item.body}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
