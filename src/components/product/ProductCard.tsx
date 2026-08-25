'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { cn, formatNumber } from '@/lib/utils';
import { localePath, pickLocalized, type Dictionary, type Locale } from '@/lib/i18n';
import { BoltIcon } from '@/components/ui/Icons';
import { RailArrow } from '@/components/home/HomeSections';
import { useRecentStore } from '@/store/recent';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  locale: Locale;
  dict: Dictionary;
  priority?: boolean;
  className?: string;
  /**
   * The reference draws two card treatments: rounded 6:7 artwork on the home
   * rails, and square sharp-cornered artwork on catalogue listings.
   */
  variant?: 'rail' | 'grid';
}

/**
 * Reference product card, top to bottom:
 *   rounded image · name · teal price with a small currency suffix ·
 *   express badge · muted "sold N  reviews N" meta line.
 */
export function ProductCard({ product, locale, dict, priority, className, variant = 'rail' }: ProductCardProps) {
  const name = pickLocalized(product.name, locale);
  const image = product.thumbnail ?? product.images?.[0]?.url;
  const discounted = product.compareAtPrice && product.compareAtPrice > product.price;

  return (
    <article className={cn('group flex flex-col', className)}>
      <Link href={localePath(locale, `/product/${product.slug}`)} className="block">
        <div
          className={cn(
            'relative w-full overflow-hidden bg-surface-soft',
            variant === 'grid' ? 'aspect-square' : 'aspect-[6/7] rounded-[24px]',
          )}
        >
          {image ? (
            <Image
              src={image}
              alt={name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1260px) 33vw, 320px"
              priority={priority}
              className="object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.05]"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-brand-50 to-surface-soft" />
          )}
        </div>

        <h3 className="mt-4 line-clamp-2 text-[14px] leading-[1.4] text-ink-muted transition-colors duration-fast group-hover:text-brand lg:text-[15px]">
          {name}
        </h3>

        <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2">
          {discounted && (
            <span className="text-[14px] font-bold text-danger-soft">
              {Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)}%
            </span>
          )}
          <span className="text-[17px] font-bold tracking-tight text-brand">
            {formatNumber(product.price)}
            <span className="ml-0.5 text-[13px] font-medium">֏</span>
          </span>
          {discounted && (
            <s className="text-[12px] text-ink-faint">{formatNumber(product.compareAtPrice!)}֏</s>
          )}
        </p>
      </Link>

      {product.sameDayAvailable && (
        <p className="mt-2 flex items-center gap-1 text-[12px] font-medium text-quick">
          <BoltIcon className="h-3.5 w-3.5" />
          {dict.product.quickBadge}
        </p>
      )}

      {(product.soldCount > 0 || product.ratingCount > 0) && (
        <p className="mt-1.5 flex flex-wrap gap-x-3 text-[11.5px] text-ink-faint">
          {product.soldCount > 0 && (
            <span>
              {dict.product.soldShort} {formatNumber(product.soldCount)}
            </span>
          )}
          {product.ratingCount > 0 && (
            <span>
              {dict.product.reviewsShort} {formatNumber(product.ratingCount)}
            </span>
          )}
        </p>
      )}
    </article>
  );
}

/** Records a view locally so the side rail can show it without an API round-trip. */
export function RecordRecentView({ product, locale }: { product: Product; locale: Locale }) {
  const push = useRecentStore((s) => s.push);

  useEffect(() => {
    push({
      slug: product.slug,
      name: pickLocalized(product.name, locale),
      thumbnail: product.thumbnail ?? product.images?.[0]?.url,
      price: product.price,
    });
  }, [product, locale, push]);

  return null;
}

export function ProductGrid({
  products,
  locale,
  dict,
  columns = 4,
  className,
}: {
  products: Product[];
  locale: Locale;
  dict: Dictionary;
  columns?: 3 | 4 | 5;
  className?: string;
}) {
  const cols = {
    3: 'grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4',
    5: 'grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5',
  }[columns];

  return (
    <div className={cn('grid gap-x-[20px] gap-y-10', cols, className)}>
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          locale={locale}
          dict={dict}
          variant="grid"
          priority={index < 4}
        />
      ))}
    </div>
  );
}

/**
 * Horizontal product carousel with the reference's circular arrows parked
 * outside the track on desktop; on touch it is a plain scroll area.
 */
export function ProductCarousel({
  products,
  locale,
  dict,
}: {
  products: Product[];
  locale: Locale;
  dict: Dictionary;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

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

  return (
    <div className="relative">
      <div
        ref={trackRef}
        onScroll={sync}
        className="grid auto-cols-[46%] grid-flow-col gap-[15px] overflow-x-auto pb-1 no-scrollbar sm:auto-cols-[31%] lg:auto-cols-[calc((100%-60px)/5)]"
      >
        {products.map((product) => (
          <ProductCard key={product.id} product={product} locale={locale} dict={dict} />
        ))}
      </div>

      {!atStart && (
        <RailArrow direction="left" onClick={() => scrollBy(-1)} className="absolute -left-4 top-[34%]" />
      )}
      {!atEnd && (
        <RailArrow direction="right" onClick={() => scrollBy(1)} className="absolute -right-4 top-[34%]" />
      )}
    </div>
  );
}
