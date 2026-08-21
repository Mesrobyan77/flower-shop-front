import { NextResponse, type NextRequest } from 'next/server';
import { defaultLocale, locales } from '@/lib/i18n/config';

const PUBLIC_FILE = /\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|json|woff2?)$/i;

/**
 * Every storefront route lives under a locale prefix. `/` and any unprefixed
 * path redirect to the visitor's best match, defaulting to Armenian.
 * `/admin` is intentionally excluded: the panel runs in a single language.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/images') ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const hasLocale = locales.some((locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`));
  if (hasLocale) return NextResponse.next();

  const cookieLocale = request.cookies.get('xf-locale')?.value;
  const headerLocale = request.headers
    .get('accept-language')
    ?.split(',')[0]
    ?.split('-')[0]
    ?.toLowerCase();

  const preferred =
    (locales as readonly string[]).includes(cookieLocale ?? '')
      ? cookieLocale!
      : (locales as readonly string[]).includes(headerLocale ?? '')
        ? headerLocale!
        : defaultLocale;

  const url = request.nextUrl.clone();
  url.pathname = `/${preferred}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
