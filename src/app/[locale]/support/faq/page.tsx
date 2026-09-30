import { notFound } from 'next/navigation';
import { serverGetPaged } from '@/lib/api/client';
import { getDictionary, isLocale, localePath, pickLocalized, type Locale } from '@/lib/i18n';
import { PageShell } from '@/components/layout/PageShell';
import { Accordion } from '@/components/layout/Accordion';
import type { Post } from '@/types';

export const revalidate = 600;

export default async function FaqPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  if (!isLocale(params.locale)) notFound();
  const { locale } = params;
  const dict = getDictionary(locale);
  const posts = await serverGetPaged<Post>('/posts', { type: 'faq', limit: 50 });

  return (
    <PageShell
      locale={locale}
      dict={dict}
      title={dict.support.faq}
      crumbs={[{ label: dict.support.title, href: localePath(locale, '/support') }]}
      narrow
    >
      <Accordion
        items={posts.items.map((post) => ({
          id: post.id,
          title: pickLocalized(post.title, locale),
          body: pickLocalized(post.body, locale),
        }))}
        emptyLabel={dict.common.empty}
      />
    </PageShell>
  );
}
