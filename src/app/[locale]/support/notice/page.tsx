import { serverGetPaged } from '@/lib/api/client';
import { getDictionary, localePath, pickLocalized, type Locale } from '@/lib/i18n';
import { PageShell } from '@/components/layout/PageShell';
import { Accordion } from '@/components/layout/Accordion';
import type { Post } from '@/types';

export const revalidate = 600;

export default async function NoticePage({ params }: { params: { locale: Locale } }) {
  const dict = getDictionary(params.locale);
  const posts = await serverGetPaged<Post>('/posts', { type: 'notice', limit: 50 });

  return (
    <PageShell
      locale={params.locale}
      dict={dict}
      title={dict.support.notice}
      crumbs={[{ label: dict.support.title, href: localePath(params.locale, '/support') }]}
      narrow
    >
      <Accordion
        items={posts.items.map((post) => ({
          id: post.id,
          title: pickLocalized(post.title, params.locale),
          body: pickLocalized(post.body, params.locale),
          meta: post.isPinned ? '★' : undefined,
        }))}
        emptyLabel={dict.common.empty}
      />
    </PageShell>
  );
}
