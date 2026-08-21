'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/Overlay';
import { ChevronIcon, SearchIcon } from '@/components/ui/Icons';
import type { ProductImage } from '@/types';

/**
 * Left column of the reference product page: a square main frame with a zoom
 * ("확대 보기") action and a thumbnail strip underneath.
 */
export function ProductGallery({ images, alt, zoomLabel }: { images: ProductImage[]; alt: string; zoomLabel: string }) {
  const ordered = [...images].sort((a, b) => a.order - b.order);
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);

  if (ordered.length === 0) {
    return <div className="aspect-square w-full rounded-tile bg-surface-soft" />;
  }

  const current = ordered[Math.min(index, ordered.length - 1)];

  return (
    <div className="flex flex-col gap-3">
      <div className="group relative aspect-square w-full overflow-hidden rounded-[16px] bg-surface-soft">
        <Image
          src={current.url}
          alt={current.alt ?? alt}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 560px"
          className="object-cover"
        />

        <button
          type="button"
          onClick={() => setZoom(true)}
          aria-label={zoomLabel}
          className="absolute bottom-4 left-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-ink-muted shadow-card transition-colors duration-fast hover:text-brand"
        >
          <SearchIcon className="h-4 w-4" />
        </button>

        {ordered.length > 1 && (
          <>
            <GalleryArrow direction="left" onClick={() => setIndex((i) => (i - 1 + ordered.length) % ordered.length)} />
            <GalleryArrow direction="right" onClick={() => setIndex((i) => (i + 1) % ordered.length)} />
          </>
        )}
      </div>

      {ordered.length > 1 && (
        <div className="flex gap-2">
          {ordered.map((image, i) => (
            <button
              key={image.url}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`${alt} ${i + 1}`}
              aria-current={i === index}
              className={cn(
                'relative h-16 w-16 overflow-hidden rounded-card border transition-colors duration-fast lg:h-20 lg:w-20',
                i === index ? 'border-ink-strong' : 'border-line hover:border-line-strong',
              )}
            >
              <Image src={image.url} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      <Modal open={zoom} onClose={() => setZoom(false)} size="lg" title={alt}>
        <div className="relative aspect-square w-full overflow-hidden rounded-[16px] bg-surface-soft">
          <Image src={current.url} alt={current.alt ?? alt} fill sizes="90vw" className="object-contain" />
        </div>
      </Modal>
    </div>
  );
}

function GalleryArrow({ direction, onClick }: { direction: 'left' | 'right'; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === 'left' ? 'Previous image' : 'Next image'}
      className={cn(
        'absolute top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-ink shadow-card',
        'opacity-0 transition-opacity duration-fast group-hover:opacity-100',
        direction === 'left' ? 'left-3' : 'right-3',
      )}
    >
      <ChevronIcon className={cn('h-4 w-4', direction === 'left' && 'rotate-180')} />
    </button>
  );
}
