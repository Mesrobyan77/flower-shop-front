'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { cn, formatNumber } from '@/lib/utils';
import { localePath, pickLocalized, type Dictionary, type Locale } from '@/lib/i18n';
import { ChevronIcon, ClockIcon, TruckIcon } from '@/components/ui/Icons';
import type { Post, ThemeTile } from '@/types';

/* --------------------------- category circle row -------------------------- */

/**
 * Directly under the hero the reference shows a single row of circular category
 * thumbnails with the label underneath - not rectangular tiles. On narrow
 * screens the row scrolls horizontally instead of wrapping.
 */
export function CategoryCircles({ tiles, locale }: { tiles: ThemeTile[]; locale: Locale }) {
  if (!tiles.length) return null;

  return (
    <nav className="border-b border-line-soft bg-white py-8 lg:py-12" aria-label="categories">
      <div className="mx-auto w-full max-w-[1400px] px-4">
        <ul className="flex justify-start gap-4 overflow-x-auto px-1 no-scrollbar lg:justify-center lg:gap-10 lg:overflow-visible">
          {[...tiles]
            .sort((a, b) => a.order - b.order)
            .map((tile) => (
              <li key={tile.href + tile.order} className="shrink-0">
                <Link href={localePath(locale, tile.href)} className="group flex w-[92px] flex-col items-center lg:w-[112px]">
                  <span className="relative block h-[92px] w-[92px] overflow-hidden rounded-full bg-surface-soft lg:h-[112px] lg:w-[112px]">
                    {tile.image && (
                      <Image
                        src={tile.image}
                        alt={pickLocalized(tile.title, locale)}
                        fill
                        sizes="112px"
                        className={cn(
                          'object-cover transition-transform duration-[600ms] ease-out group-hover:scale-105',
                          tile.animated && 'animate-slow-pan',
                        )}
                      />
                    )}
                  </span>
                  <span className="mt-3 text-center text-[13px] font-medium leading-snug text-ink transition-colors duration-fast group-hover:text-brand lg:text-[14px]">
                    {pickLocalized(tile.title, locale)}
                  </span>
                </Link>
              </li>
            ))}
        </ul>
      </div>
    </nav>
  );
}

/* ------------------------------ section header ---------------------------- */

/** Bold title on the left, a muted "see more →" link on the right. */
export function HomeSectionHeader({
  title,
  href,
  moreLabel,
  centered,
  className,
}: {
  title: string;
  href?: string;
  moreLabel?: string;
  centered?: boolean;
  className?: string;
}) {
  if (centered) {
    return (
      <div className={cn('mb-7 text-center', className)}>
        <h2 className="text-[22px] font-bold tracking-tight text-ink-strong lg:text-[28px]">{title}</h2>
      </div>
    );
  }

  return (
    <div className={cn('mb-6 flex items-end justify-between gap-4 lg:mb-8', className)}>
      <h2 className="text-[21px] font-bold tracking-tight text-ink-strong lg:text-[26px]">{title}</h2>
      {href && (
        <Link
          href={href}
          className="group inline-flex shrink-0 items-center gap-1.5 text-[13px] text-ink-soft transition-colors duration-fast hover:text-ink"
        >
          {moreLabel}
          <span className="transition-transform duration-fast group-hover:translate-x-0.5">&rarr;</span>
        </Link>
      )}
    </div>
  );
}

/** Rounded pill tabs used to switch a section between collections. */
export function PillTabs({
  items,
  active,
  onChange,
  className,
}: {
  items: { key: string; label: string }[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
}) {
  if (items.length <= 1) return null;

  return (
    <div className={cn('flex flex-wrap gap-2', className)} role="tablist">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          role="tab"
          aria-selected={active === item.key}
          onClick={() => onChange(item.key)}
          className={cn(
            'h-9 rounded-pill px-5 text-[13px] font-medium transition-colors duration-fast',
            active === item.key
              ? 'bg-brand text-white'
              : 'border border-line bg-white text-ink-muted hover:border-ink-soft hover:text-ink',
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

/* --------------------------- edge-to-edge image rail ---------------------- */

/**
 * The "new arrivals" strip runs past both edges of the viewport and scrolls
 * horizontally, showing artwork only - no captions.
 */
export function ImageRail({
  items,
  locale,
}: {
  items: { slug: string; image?: string; alt: string }[];
  locale: Locale;
}) {
  if (!items.length) return null;

  return (
    <div className="overflow-x-auto pb-2 no-scrollbar">
      <div className="flex gap-4 px-4 lg:px-10">
        {items.map((item) => (
          <Link
            key={item.slug}
            href={localePath(locale, `/product/${item.slug}`)}
            className="group relative block h-[220px] w-[200px] shrink-0 overflow-hidden rounded-[18px] bg-surface-soft lg:h-[300px] lg:w-[260px]"
          >
            {item.image && (
              <Image
                src={item.image}
                alt={item.alt}
                fill
                sizes="260px"
                className="object-cover transition-transform duration-[600ms] ease-out group-hover:scale-105"
              />
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------- counters -------------------------------- */

/**
 * Starts at the final number so the server-rendered HTML carries the real
 * figure (it is a trust signal and should survive with JS off). On the client
 * the value is reset to zero before paint, then counted up once the band
 * scrolls into view.
 */
function useCountUp(target: number, active: boolean, duration = 1400) {
  const [value, setValue] = useState(target);

  useLayoutEffect(() => {
    setValue(0);
  }, []);

  useEffect(() => {
    if (!active) return undefined;
    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, active, duration]);

  return value;
}

/**
 * Award badge on the left, then the two head-line numbers in brand teal with a
 * muted caption underneath - the reference's trust band.
 */
export function AwardBand({
  counters,
  locale,
  dict,
}: {
  counters: { reviews: number; deliveries: number; awardYears: number };
  locale: Locale;
  dict: Dictionary;
}) {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setActive(true), {
      threshold: 0.3,
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const deliveries = useCountUp(counters.deliveries, active);
  const reviews = useCountUp(counters.reviews, active);
  const years = useCountUp(counters.awardYears, active, 900);

  return (
    <section ref={ref} className="py-14 lg:py-20">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col items-center gap-10 px-4 lg:flex-row lg:justify-center lg:gap-24">
        <div className="flex items-center gap-5">
          <AwardMedal years={counters.awardYears} />
          <div>
            <p className="text-[22px] font-bold leading-tight text-danger-soft lg:text-[26px]">
              {formatNumber(years)} {dict.home.awardYearsLabel}
            </p>
            <p className="text-[19px] font-bold leading-tight text-ink-strong lg:text-[23px]">
              {dict.home.awardTitle}
            </p>
            <Link
              href={localePath(locale, '/awards')}
              className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-pill bg-surface-soft px-4 text-[12px] text-ink-muted transition-colors duration-fast hover:bg-line-soft"
            >
              {dict.common.more} &rarr;
            </Link>
          </div>
        </div>

        <div className="flex gap-12 lg:gap-20">
          <div className="text-center lg:text-left">
            <p className="font-display text-[32px] font-bold leading-none tracking-tight text-brand lg:text-[44px]">
              {formatNumber(deliveries)}
            </p>
            <p className="mt-2 text-[12px] text-ink-soft lg:text-[13px]">{dict.home.counterDeliveries}</p>
          </div>
          <div className="text-center lg:text-left">
            <p className="font-display text-[32px] font-bold leading-none tracking-tight text-brand lg:text-[44px]">
              {formatNumber(reviews)}
            </p>
            <p className="mt-2 text-[12px] text-ink-soft lg:text-[13px]">{dict.home.counterReviews}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function AwardMedal({ years }: { years: number }) {
  return (
    <svg viewBox="0 0 120 120" className="h-[88px] w-[88px] shrink-0 lg:h-[112px] lg:w-[112px]" aria-hidden>
      <defs>
        <radialGradient id="medal" cx="38%" cy="32%" r="72%">
          <stop offset="0%" stopColor="#fff2c0" />
          <stop offset="55%" stopColor="#f2c14b" />
          <stop offset="100%" stopColor="#b8860b" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="52" fill="url(#medal)" />
      <circle cx="60" cy="60" r="43" fill="none" stroke="#8a6508" strokeWidth="1.5" opacity="0.6" />
      <circle cx="60" cy="60" r="34" fill="#a8791a" opacity="0.25" />
      <text
        x="60"
        y="56"
        textAnchor="middle"
        fill="#5c4406"
        fontSize="26"
        fontWeight="700"
        fontFamily="var(--font-display), Roboto, Arial, sans-serif"
      >
        {years}
      </text>
      <text
        x="60"
        y="74"
        textAnchor="middle"
        fill="#5c4406"
        fontSize="11"
        letterSpacing="1.4"
        fontFamily="var(--font-display), Roboto, Arial, sans-serif"
      >
        YEARS
      </text>
    </svg>
  );
}

/* ------------------------------ quick banner ------------------------------ */

export function QuickBanner({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <section className="mx-auto w-full max-w-[1400px] px-4 py-10 lg:py-14">
      <Link
        href={`${localePath(locale, '/catalog/flower-gifts')}?delivery=quick`}
        className="group relative flex flex-col gap-4 overflow-hidden rounded-[24px] bg-brand px-6 py-9 text-white lg:flex-row lg:items-center lg:justify-between lg:px-12 lg:py-12"
      >
        <span className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" aria-hidden />
        <div className="relative">
          <p className="text-[21px] font-bold leading-snug lg:text-[28px]">{dict.home.quickBanner}</p>
          <p className="mt-2 flex items-center gap-2 text-[13px] text-white/85 lg:text-[14px]">
            <ClockIcon className="h-4 w-4" />
            {dict.home.quickBannerSub}
          </p>
        </div>
        <span className="relative inline-flex h-11 items-center gap-2 self-start rounded-pill bg-white px-6 text-[13px] font-medium text-brand transition-transform duration-fast group-hover:translate-x-1 lg:self-auto">
          <TruckIcon className="h-4 w-4" />
          {dict.common.seeAll}
        </span>
      </Link>
    </section>
  );
}

/* ---------------------------- subscription CTA ---------------------------- */

export function SubscriptionTeaser({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <section className="mx-auto w-full max-w-[1400px] px-4 pb-10 lg:pb-14">
      <div className="grid overflow-hidden rounded-[24px] border border-line lg:grid-cols-2">
        <div className="flex flex-col justify-center gap-3 px-6 py-10 lg:px-14 lg:py-16">
          <p className="text-[11px] uppercase tracking-[0.22em] text-olive-dark">{dict.nav.subscription}</p>
          <h2 className="text-[23px] font-bold leading-snug text-ink-strong lg:text-[32px]">
            {dict.home.subscriptionTeaser}
          </h2>
          <p className="text-[13.5px] leading-relaxed text-ink-muted">{dict.home.subscriptionTeaserSub}</p>
          <Link
            href={localePath(locale, '/subscription')}
            className="mt-4 inline-flex h-11 w-fit items-center rounded-pill bg-ink-strong px-7 text-[13px] font-medium text-white transition-colors duration-fast hover:bg-ink"
          >
            {dict.common.more}
          </Link>
        </div>
        <div className="relative min-h-[240px] bg-brand-50 lg:min-h-[340px]">
          <Image
            src="/images/seed/subscribe-01.svg"
            alt={dict.home.subscriptionTeaser}
            fill
            sizes="(max-width: 768px) 100vw, 700px"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ photo gallery ----------------------------- */

/** Masonry-ish customer gallery, mirroring the reference's mixed-size grid. */
export function PhotoGallery({ images, title }: { images: string[]; title: string }) {
  if (images.length < 6) return null;

  const spans = [
    'col-span-2 row-span-2',
    'col-span-1 row-span-1',
    'col-span-2 row-span-1',
    'col-span-1 row-span-1',
    'col-span-1 row-span-1',
    'col-span-2 row-span-2',
    'col-span-1 row-span-2',
    'col-span-1 row-span-1',
    'col-span-1 row-span-1',
    'col-span-1 row-span-1',
  ];

  return (
    <section className="mx-auto w-full max-w-[1400px] px-4 pb-14 lg:pb-20" aria-label={title}>
      <div className="grid auto-rows-[110px] grid-cols-4 gap-3 lg:auto-rows-[150px] lg:grid-cols-6 lg:gap-4">
        {images.slice(0, spans.length).map((src, index) => (
          <div
            key={`${src}-${index}`}
            className={cn('relative overflow-hidden rounded-[14px] bg-surface-soft', spans[index])}
          >
            <Image src={src} alt="" fill sizes="(max-width: 768px) 50vw, 400px" className="object-cover" />
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------- magazine -------------------------------- */

export function MagazineStrip({
  posts,
  locale,
  dict,
}: {
  posts: Post[];
  locale: Locale;
  dict: Dictionary;
}) {
  if (!posts.length) return null;

  return (
    <section className="mx-auto w-full max-w-[1400px] px-4 pb-14 lg:pb-20">
      <HomeSectionHeader
        title={dict.support.magazine}
        href={localePath(locale, '/magazine')}
        moreLabel={`${dict.support.magazine} ${dict.common.more}`}
      />

      <div className="grid gap-5 lg:grid-cols-3">
        {posts.slice(0, 3).map((post) => (
          <Link key={post.id} href={localePath(locale, `/magazine/${post.slug}`)} className="group flex flex-col">
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[16px] bg-surface-soft">
              {post.coverImage && (
                <Image
                  src={post.coverImage}
                  alt={pickLocalized(post.title, locale)}
                  fill
                  sizes="(max-width: 768px) 100vw, 440px"
                  className="object-cover transition-transform duration-[600ms] ease-out group-hover:scale-105"
                />
              )}
            </div>
            <h3 className="mt-3 line-clamp-2 text-[15px] font-medium leading-snug text-ink transition-colors duration-fast group-hover:text-brand">
              {pickLocalized(post.title, locale)}
            </h3>
            {post.excerpt && (
              <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-ink-soft">
                {pickLocalized(post.excerpt, locale)}
              </p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------ carousel arrows --------------------------- */

export function RailArrow({
  direction,
  onClick,
  className,
}: {
  direction: 'left' | 'right';
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === 'left' ? 'Previous' : 'Next'}
      className={cn(
        'hidden h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-ink-muted',
        'shadow-card transition-colors duration-fast hover:border-ink-soft hover:text-ink lg:flex',
        className,
      )}
    >
      <ChevronIcon className={cn('h-4 w-4', direction === 'left' && 'rotate-180')} />
    </button>
  );
}
