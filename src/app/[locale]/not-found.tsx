import Link from 'next/link';

export default function LocaleNotFound() {
  return (
    <div className="rail flex flex-col items-center justify-center gap-4 py-28 text-center">
      <p className="font-display text-[64px] font-bold leading-none text-brand-100">404</p>
      <h1 className="text-[18px] font-semibold text-ink-strong">Page not found</h1>
      <Link
        href="/"
        className="mt-2 inline-flex h-11 items-center rounded-card bg-brand px-6 text-[13px] font-medium text-white transition-colors duration-fast hover:bg-brand-600"
      >
        Home
      </Link>
    </div>
  );
}
