import { cn } from '@/lib/utils';

/**
 * The reference logo block is a fixed 155x26 image swapped between a white and a
 * coloured file. Ours is inline SVG so a single component covers both skins and
 * stays crisp at any density.
 */
export function Wordmark({ tone = 'brand', className }: { tone?: 'brand' | 'light' | 'dark'; className?: string }) {
  const color = tone === 'light' ? '#ffffff' : tone === 'dark' ? '#111111' : '#008577';
  const accent = tone === 'light' ? 'rgba(255,255,255,0.75)' : '#71a200';

  return (
    <svg
      viewBox="0 0 155 26"
      width={155}
      height={26}
      className={cn('h-[22px] w-[132px] lg:h-[26px] lg:w-[155px]', className)}
      role="img"
      aria-label="Anahit Flower Design"
    >
      <g fill="none" stroke={accent} strokeWidth="1.4" strokeLinecap="round">
        <circle cx="13" cy="9.5" r="3.1" fill={accent} stroke="none" opacity="0.9" />
        <path d="M13 6.4c0-2.6-1.2-4.4-3.2-4.4S6.6 3.8 6.6 6.4c0 1.2.5 2.2 1.4 3" />
        <path d="M13 6.4c0-2.6 1.2-4.4 3.2-4.4s3.2 1.8 3.2 4.4c0 1.2-.5 2.2-1.4 3" />
        <path d="M10 9.5c-2.3-1.2-4.6-1-5.5.8-.9 1.8.1 3.9 2.4 5.1" />
        <path d="M16 9.5c2.3-1.2 4.6-1 5.5.8.9 1.8-.1 3.9-2.4 5.1" />
        <path d="M13 12.6V24" />
        <path d="M13 18.4c-2-2-4-2.5-5.8-1.6M13 21.4c2-2 4-2.5 5.8-1.6" />
      </g>
      <text
        x="32"
        y="13"
        fill={color}
        fontSize="15"
        fontWeight="700"
        letterSpacing="1.8"
        fontFamily="var(--font-display), Roboto, Arial, sans-serif"
      >
        ANAHIT
      </text>
      <text
        x="32"
        y="23"
        fill={color}
        fontSize="7.5"
        letterSpacing="2.6"
        opacity="0.8"
        fontFamily="var(--font-display), Roboto, Arial, sans-serif"
      >
        FLOWER DESIGN
      </text>
    </svg>
  );
}
