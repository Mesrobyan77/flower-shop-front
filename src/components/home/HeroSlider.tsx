'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { localePath, pickLocalized, type Locale } from '@/lib/i18n';
import { ChevronIcon } from '@/components/ui/Icons';
import type { HeroSlide } from '@/types';

const AUTOPLAY_MS = 6000;

/**
 * Full-bleed hero the header floats over. The reference cuts a large rounded
 * corner out of the bottom-right of the image and lets a teal panel show
 * through, with the "next" affordance sitting inside that notch.
 */
export function HeroSlider({
  slides,
  locale,
}: {
  slides: HeroSlide[];
  locale: Locale;
}) {
  const ordered = [...slides].sort((a, b) => a.order - b.order);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef<number | null>(null);

  const count = ordered.length;

  const go = useCallback(
    (next: number) => {
      if (count === 0) return;
      setIndex(((next % count) + count) % count);
    },
    [count],
  );

  useEffect(() => {
    if (paused || count <= 1) return undefined;
    const timer = setInterval(() => setIndex((current) => (current + 1) % count), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [paused, count]);

  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  if (count === 0) {
    return <div className="h-[420px] w-full bg-brand-100 lg:h-[720px]" />;
  }

  const active = ordered[index];

  return (
    <section className="relative bg-brand" aria-roledescription="carousel">
      <div
        className="relative h-[460px] w-full overflow-hidden rounded-br-[120px] bg-ink-black sm:h-[520px] lg:h-[684px]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={(event) => {
          touchStart.current = event.touches[0].clientX;
        }}
        onTouchEnd={(event) => {
          if (touchStart.current === null) return;
          const delta = event.changedTouches[0].clientX - touchStart.current;
          if (Math.abs(delta) > 50) go(index + (delta < 0 ? 1 : -1));
          touchStart.current = null;
        }}
      >
        {ordered.map((slide, i) => (
          <div
            key={`${slide.image}-${i}`}
            className={cn(
              'absolute inset-0 transition-opacity duration-[900ms] ease-out',
              i === index ? 'opacity-100' : 'pointer-events-none opacity-0',
            )}
            aria-hidden={i !== index}
          >
            <Image
              src={slide.image}
              alt={pickLocalized(slide.title, locale) || 'hero'}
              fill
              priority={i === 0}
              sizes="100vw"
              className={cn('object-cover', i === index && 'animate-slow-pan')}
            />
            {/* the scrim only has to carry the bottom-left headline; the header lays
                its own teal wash over the top edge, so keep that end almost clear */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent" />
            {slide.href && (
              <Link
                href={localePath(locale, slide.href)}
                className="absolute inset-0"
                tabIndex={i === index ? 0 : -1}
                aria-label={pickLocalized(slide.title, locale)}
              />
            )}
          </div>
        ))}

        {/* headline sits low-left over the image, matching the reference */}
        <div className="absolute inset-x-0 bottom-[76px] lg:bottom-[103px]">
          <div className="mx-auto w-full max-w-[1260px] px-6 lg:pl-[45px] lg:pr-0">
            <div className="pointer-events-none max-w-[640px] text-white">
              {active.title && (
                <h2 className="text-[27px] font-bold leading-[1.4] drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)] lg:text-[39px]">
                  {pickLocalized(active.title, locale)}
                </h2>
              )}
              {active.subtitle && (
                <p className="mt-1 text-[15px] font-medium leading-[1.4] text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.35)] lg:text-[21px]">
                  {pickLocalized(active.subtitle, locale)}
                </p>
              )}
            </div>
          </div>
        </div>

        {count > 1 && (
          <>
            <HeroArrow direction="left" onClick={() => go(index - 1)} />
            <HeroArrow direction="right" onClick={() => go(index + 1)} />

            <div className="absolute inset-x-0 bottom-[38px] mx-auto flex w-full max-w-[1260px] items-center gap-2.5 px-6 lg:bottom-[56px] lg:pl-[45px]">
              {ordered.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Slide ${i + 1}`}
                  aria-current={i === index}
                  className={cn(
                    'h-2 w-2 rounded-full transition-all duration-base',
                    i === index ? 'bg-white' : 'bg-white/45 hover:bg-white/75',
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* the teal notch under the rounded corner carries a forward affordance */}
      {count > 1 && (
        <button
          type="button"
          onClick={() => go(index + 1)}
          aria-label="Next slide"
          className="absolute bottom-4 right-6 hidden h-11 w-11 items-center justify-center rounded-full text-white/90 transition-transform duration-fast hover:translate-x-1 lg:flex"
        >
          <ArrowRight />
        </button>
      )}
    </section>
  );
}

function HeroArrow({ direction, onClick }: { direction: 'left' | 'right'; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === 'left' ? 'Previous slide' : 'Next slide'}
      className={cn(
        'absolute top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full',
        'bg-white/25 text-white backdrop-blur-[6px] transition-colors duration-fast hover:bg-white/45 lg:flex',
        direction === 'left' ? 'left-5' : 'right-5',
      )}
    >
      <ChevronIcon className={cn('h-5 w-5', direction === 'left' && 'rotate-180')} />
    </button>
  );
}

function ArrowRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-6 w-6" aria-hidden>
      <path d="M4 12h15M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
