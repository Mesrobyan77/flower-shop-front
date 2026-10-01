import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base = (props: IconProps) => ({
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...props,
});

export const SearchIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </svg>
);

export const UserIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-3.6 3.6-6 8-6s8 2.4 8 6" />
  </svg>
);

export const BagIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M6 8h12l-1 12H7L6 8z" />
    <path d="M9 8V6.5a3 3 0 016 0V8" />
  </svg>
);

export const MenuIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const GridIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <rect x="4" y="4" width="6.5" height="6.5" rx="1" />
    <rect x="13.5" y="4" width="6.5" height="6.5" rx="1" />
    <rect x="4" y="13.5" width="6.5" height="6.5" rx="1" />
    <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1" />
  </svg>
);

export const CloseIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M5 5l14 14M19 5L5 19" />
  </svg>
);

export const HeartIcon = ({ filled, ...props }: IconProps & { filled?: boolean }) => (
  <svg {...base(props)} fill={filled ? 'currentColor' : 'none'}>
    <path d="M12 20s-7-4.4-7-9.2A4 4 0 0112 7.6 4 4 0 0119 10.8C19 15.6 12 20 12 20z" />
  </svg>
);

export const ChevronIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M9 6l6 6-6 6" />
  </svg>
);

export const ChevronDownIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export const TruckIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" />
    <circle cx="7" cy="18" r="1.8" />
    <circle cx="17.5" cy="18" r="1.8" />
  </svg>
);

export const ClockIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
);

export const PhoneIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M6 3.5h3l1.5 4-2 1.6a12 12 0 006.4 6.4l1.6-2 4 1.5v3a2 2 0 01-2.2 2A17 17 0 014 5.7 2 2 0 016 3.5z" />
  </svg>
);

export const MailIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <rect x="3" y="5.5" width="18" height="13" rx="2" />
    <path d="M3.5 7l8.5 6 8.5-6" />
  </svg>
);

export const CheckIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

export const PlusIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const MinusIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M5 12h14" />
  </svg>
);

export const TrashIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M4 7h16M9 7V5h6v2M6.5 7l1 12h9l1-12" />
  </svg>
);

export const GlobeIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17M12 3.5c2.2 2.4 3.3 5.3 3.3 8.5S14.2 18.1 12 20.5c-2.2-2.4-3.3-5.3-3.3-8.5S9.8 5.9 12 3.5z" />
  </svg>
);

export const StarIcon = (props: IconProps) => (
  <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path d="M10 1.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L1.6 7.7l5.8-.8z" />
  </svg>
);

export const FlowerIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="12" cy="9" r="2.2" />
    <path d="M12 6.8c0-1.9-.9-3.3-2.4-3.3S7.2 4.9 7.2 6.8c0 .9.4 1.6 1 2.2M12 6.8c0-1.9.9-3.3 2.4-3.3s2.4 1.4 2.4 3.3c0 .9-.4 1.6-1 2.2" />
    <path d="M9.8 9c-1.7-.9-3.4-.7-4.1.6s.1 2.9 1.8 3.8M14.2 9c1.7-.9 3.4-.7 4.1.6s-.1 2.9-1.8 3.8" />
    <path d="M12 11.2V21" />
    <path d="M12 16c-1.6-1.6-3.2-2-4.6-1.3M12 18.5c1.6-1.6 3.2-2 4.6-1.3" />
  </svg>
);

export const ShareIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="18" cy="5.5" r="2.5" />
    <circle cx="6" cy="12" r="2.5" />
    <circle cx="18" cy="18.5" r="2.5" />
    <path d="M8.2 10.8l7.6-4M8.2 13.2l7.6 4" />
  </svg>
);

export const FilterIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M4 6h16M7 12h10M10 18h4" />
  </svg>
);

export const ArrowUpIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </svg>
);

export const GiftIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <rect x="3.5" y="9" width="17" height="11" rx="1.5" />
    <path d="M2.5 9h19v3.5h-19zM12 9v11" />
    <path d="M12 9S10.8 4.5 8.4 4.5A2.2 2.2 0 008.4 9zM12 9s1.2-4.5 3.6-4.5A2.2 2.2 0 0115.6 9z" />
  </svg>
);

export const BoltIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M13.2 2L4.6 13.1c-.3.4 0 1 .5 1h5l-1.4 7.4c-.1.6.7.9 1 .4l8.7-11.2c.3-.4 0-1-.5-1h-5l1.4-7.3c.1-.6-.7-.9-1.1-.4z" />
  </svg>
);

export const InstagramIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <rect x="3" y="3" width="18" height="18" rx="4.5" />
    <circle cx="12" cy="12" r="3.8" />
    <path d="M17.2 6.8h.01" />
  </svg>
);

export const FacebookIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M17 3h-3a4 4 0 00-4 4v3.5H7V14h3v7h3.5v-7h3l.5-3.5h-3.5V7.5c0-.6.4-1 1-1H17z" />
  </svg>
);

export const YouTubeIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M21.6 7.2a2.4 2.4 0 00-1.7-1.7C18.4 5.1 12 5.1 12 5.1s-6.4 0-7.9.4a2.4 2.4 0 00-1.7 1.7A25 25 0 002 12a25 25 0 00.4 4.8 2.4 2.4 0 001.7 1.7c1.5.4 7.9.4 7.9.4s6.4 0 7.9-.4a2.4 2.4 0 001.7-1.7A25 25 0 0022 12a25 25 0 00-.4-4.8z" />
    <path d="M10 15.2V8.8l5.2 3.2z" />
  </svg>
);

export const TelegramIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M22 2l-7 20-4-9-9-4z" />
    <path d="M22 2L11 13" />
  </svg>
);

export const FileIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M6.5 3.5h7.5l4 4v13H6.5z" />
    <path d="M14 3.5v4h4" />
    <path d="M9.5 11.5h5M9.5 15h5" />
  </svg>
);

export const ListIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M4.5 6.5h15M4.5 12h15M4.5 17.5h15" />
  </svg>
);
