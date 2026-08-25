'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { cn, formatNumber } from '@/lib/utils';
import { localePath, pickLocalized, type Dictionary, type Locale } from '@/lib/i18n';
import { RailArrow } from './HomeSections';
import type { Collection, Product } from '@/types';

/**
 * The band reads as one continuous mural rather than five tiles: the panels
 * overlap slightly and each one fades in from its left edge, so neighbouring
 * canvases bleed into each other the way a gallery wall would.
 *
 * Widths are uneven on purpose - the night sky carries the centre while the
 * water lilies trail off at the right. All five works are public domain
 * (Van Gogh d.1890, Klimt d.1918, Monet d.1926); scans come from
 * scripts/fetch-gallery-panels.mjs.
 */
const GALLERY_PANELS = [
  { name: 'art-01', grow: 18, focus: '60% 50%' },
  { name: 'art-02', grow: 18, focus: '50% 50%' },
  { name: 'art-03', grow: 28, focus: '50% 50%' },
  { name: 'art-04', grow: 22, focus: '45% 45%' },
  { name: 'art-05', grow: 14, focus: '40% 50%' },
].map((panel) => ({ ...panel, src: `/images/seed/${panel.name}.jpg` }));

/** How far each canvas dissolves into the one on its left. */
const BLEND = 'linear-gradient(to right, transparent 0%, #000 20%)';

/**
 * Gallery band: a full-bleed painterly backdrop with the product rail straddling
 * its bottom edge, so each card sits half over the artwork and half on white.
 *
 * Card artwork keeps the 6:7 module the rest of the catalogue uses, but the
 * caption differs from the standard card - name in muted grey, price in bold
 * ink rather than brand teal, and no badges or sold/review meta.
 */
export function ArtLineSection({
  collection,
  locale,
  dict,
}: {
  collection: Collection;
  locale: Locale;
  dict: Dictionary;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const products = (collection.products ?? []) as Product[];

  const sync = () => {
    const node = trackRef.current;
    if (!node) return;
    setAtStart(node.scrollLeft <= 4);
    setAtEnd(node.scrollLeft + node.clientWidth >= node.scrollWidth - 4);
  };

  useEffect(sync, [products.length]);

  const scrollBy = (direction: 1 | -1) => {
    const node = trackRef.current;
    if (!node) return;
    node.scrollBy({ left: direction * node.clientWidth * 0.8, behavior: 'smooth' });
  };

  if (!products.length) return null;

  const title = pickLocalized(collection.title, locale);
  const subtitle = pickLocalized(collection.subtitle, locale);

  return (
    <section className="relative" aria-label={title}>
      {/* the artwork band the rail overlaps */}
      <div className="relative h-[280px] w-full overflow-hidden bg-ink-strong sm:h-[360px] lg:h-[530px]">
        {/* canvases overlap and dissolve into one another */}
        <div className="absolute inset-0 flex" aria-hidden>
          {GALLERY_PANELS.map((panel, index) => (
            <div
              key={panel.name}
              className={cn('relative h-full', index > 2 && 'hidden sm:block')}
              style={{
                flexGrow: panel.grow,
                flexBasis: 0,
                marginLeft: index === 0 ? undefined : '-3%',
                maskImage: index === 0 ? undefined : BLEND,
                WebkitMaskImage: index === 0 ? undefined : BLEND,
              }}
            >
              <Image
                src={panel.src}
                alt=""
                fill
                sizes="(max-width: 640px) 40vw, 30vw"
                className="object-cover"
                style={{ objectPosition: panel.focus }}
                priority={index < 3}
              />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/10 to-black/25" />

        <div className="absolute inset-x-0 top-0">
          <div className="mx-auto w-full max-w-[1292px] px-4 pt-10 lg:pt-14">
            <h2 className="text-[24px] font-bold leading-[1.4] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.4)] lg:text-[31px]">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 max-w-[560px] text-[13px] text-white/90 drop-shadow-[0_1px_8px_rgba(0,0,0,0.4)] lg:text-[16px]">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* pulled up so the cards straddle the band's bottom edge */}
      <div className="relative -mt-[150px] pb-12 sm:-mt-[170px] lg:-mt-[140px] lg:pb-20">
        <div className="mx-auto w-full max-w-[1292px] px-4">
          <div className="relative">
            <div
              ref={trackRef}
              onScroll={sync}
              className={cn(
                'grid auto-cols-[62%] grid-flow-col gap-[15px] overflow-x-auto pb-1 no-scrollbar',
                'sm:auto-cols-[38%] lg:auto-cols-[calc((100%-60px)/5)]',
              )}
            >
              {products.map((product) => {
                const name = pickLocalized(product.name, locale);
                const image = product.thumbnail ?? product.images?.[0]?.url;

                return (
                  <Link
                    key={product.id}
                    href={localePath(locale, `/product/${product.slug}`)}
                    className="group flex flex-col"
                  >
                    <div className="relative aspect-[6/7] w-full overflow-hidden rounded-[16px] bg-surface-soft shadow-card">
                      {image && (
                        <Image
                          src={image}
                          alt={name}
                          fill
                          sizes="(max-width: 768px) 62vw, 240px"
                          className="object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.05]"
                        />
                      )}
                    </div>

                    <h3 className="mt-4 line-clamp-1 text-[14px] leading-[1.4] text-ink-muted transition-colors duration-fast group-hover:text-brand lg:text-[15px]">
                      {name}
                    </h3>
                    <p className="mt-1 text-[17px] font-bold tracking-tight text-ink-strong lg:text-[19px]">
                      {formatNumber(product.price)}
                      <span className="ml-0.5 text-[13px] font-medium">֏</span>
                    </p>
                  </Link>
                );
              })}
            </div>

            {!atStart && (
              <RailArrow direction="left" onClick={() => scrollBy(-1)} className="absolute -left-4 top-[38%]" />
            )}
            {!atEnd && (
              <RailArrow direction="right" onClick={() => scrollBy(1)} className="absolute -right-4 top-[38%]" />
            )}
          </div>

          <div className="mt-8 flex justify-center">
            <Link
              href={localePath(locale, `/collections/${collection.slug}`)}
              className="inline-flex h-11 items-center rounded-pill border border-line-strong px-7 text-[13px] text-ink-muted transition-colors duration-fast hover:border-brand hover:text-brand lg:text-[14px]"
            >
              {dict.common.seeAll}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
