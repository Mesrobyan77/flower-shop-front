import type { ReactNode } from 'react';
import { Breadcrumb } from '@/components/ui/Display';
import { localePath, type Dictionary, type Locale } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/** Shared chrome for editorial and policy pages. */
export function PageShell({
  locale,
  dict,
  title,
  subtitle,
  crumbs = [],
  children,
  narrow,
}: {
  locale: Locale;
  dict: Dictionary;
  title: string;
  subtitle?: string;
  crumbs?: { label: string; href?: string }[];
  children: ReactNode;
  narrow?: boolean;
}) {
  return (
    <div className="rail py-6 lg:py-10">
      <Breadcrumb
        items={[
          { label: dict.product.breadcrumbHome, href: localePath(locale, '/') },
          ...crumbs,
          { label: title },
        ]}
      />

      <header className="mt-4 border-b border-line pb-6 lg:mt-6 lg:pb-8">
        <h1 className="text-[24px] font-semibold tracking-tight text-ink-strong lg:text-[32px]">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-ink-muted">{subtitle}</p>}
      </header>

      <div className={cn('pt-8 lg:pt-10', narrow && 'mx-auto max-w-3xl')}>{children}</div>
    </div>
  );
}

/** Vertical stack of titled prose blocks used by policy and info pages. */
export function InfoBlocks({ blocks }: { blocks: { title: string; body: string | ReactNode }[] }) {
  return (
    <div className="flex flex-col gap-8">
      {blocks.map((block) => (
        <section key={block.title}>
          <h2 className="text-[15px] font-semibold text-ink-strong">{block.title}</h2>
          <div className="mt-2 whitespace-pre-line text-[13.5px] leading-[1.9] text-ink-muted">{block.body}</div>
        </section>
      ))}
    </div>
  );
}
