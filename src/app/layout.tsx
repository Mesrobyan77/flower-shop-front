import type { Metadata, Viewport } from 'next';
import { Noto_Sans_Armenian, Roboto } from 'next/font/google';
import './globals.css';

const sans = Noto_Sans_Armenian({
  subsets: ['armenian', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const display = Roboto({
  subsets: ['latin', 'cyrillic'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Xch Flower',
    template: '%s | Xch Flower',
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
};

/** Matches the reference `theme-color` so mobile browser chrome picks up the brand teal. */
export const viewport: Viewport = {
  themeColor: '#008577',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hy-AM" className={`${sans.variable} ${display.variable}`}>
      <body>{children}</body>
    </html>
  );
}
