import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Providers } from '@/app/providers';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SideRail } from '@/components/layout/SideRail';
import { LocaleHtmlLang } from '@/components/seo/LocaleHtmlLang';
import { getDictionary, isLocale, locales, normalizeLocale, type Locale } from '@/lib/i18n';
import { ogLocale } from '@/lib/seo';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

/** Title/description defaults only — canonical and alternates belong to each page. */
export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  const dict = getDictionary(params.locale);
  return {
    title: { default: `${dict.meta.siteName} - ${dict.meta.tagline}`, template: `%s | ${dict.meta.siteName}` },
    description: dict.meta.description,
    openGraph: {
      siteName: dict.meta.siteName,
      title: `${dict.meta.siteName} - ${dict.meta.tagline}`,
      description: dict.meta.description,
      locale: ogLocale(normalizeLocale(params.locale)),
      type: 'website',
    },
  };
}

export default async function LocaleLayout(
  props: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;

  const {
    children
  } = props;

  if (!isLocale(params.locale)) notFound();

  const locale = params.locale as Locale;
  const dict = getDictionary(locale);

  return (
    <Providers>
      <LocaleHtmlLang locale={locale} />
      <div className="flex min-h-screen flex-col">
        <Header locale={locale} dict={dict} />
        <main className="flex-1">{children}</main>
        <Footer locale={locale} dict={dict} />
        <SideRail locale={locale} dict={dict} />
      </div>
    </Providers>
  );
}
