import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * Canonical AURELIA lockup, generated from scripts/brand/aurelia-logo-source.png
 * by scripts/build-brand-assets.mjs. The supplied artwork stacks the monogram
 * above the wordmark, so the tall aspect ratio needs explicit sizing at each
 * call site; `tone="light"` is the all-white variant for dark surfaces.
 */
const COLOR_LOGO = { src: '/brand/aurelia-logo.png', width: 171, height: 101 };
const LIGHT_LOGO = { src: '/brand/aurelia-logo-light.png', width: 171, height: 101 };

export function Wordmark({
  tone = 'brand',
  priority = false,
  className,
}: {
  tone?: 'brand' | 'light';
  priority?: boolean;
  className?: string;
}) {
  const logo = tone === 'light' ? LIGHT_LOGO : COLOR_LOGO;

  return (
    <Image
      src={logo.src}
      alt="AURELIA"
      width={logo.width}
      height={logo.height}
      priority={priority}
      className={cn('h-12 w-auto', className)}
    />
  );
}
