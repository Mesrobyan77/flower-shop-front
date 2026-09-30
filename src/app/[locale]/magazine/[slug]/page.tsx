import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { serverGet } from '@/lib/api/client';
import { getDictionary, isLocale, localePath, pickLocalized, type Locale } from '@/lib/i18n';
import { PageShell } from '@/components/layout/PageShell';
import { formatDate } from '@/lib/utils';
import type { Post } from '@/types';

export const revalidate = 300;

interface Params {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata(props: Params): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.locale)) notFound();
  const post = await serverGet<Post>(`/posts/${params.slug}`);
  if (!post) return {};
  return {
    title: pickLocalized(post.title, params.locale),
    description: pickLocalized(post.excerpt, params.locale),
  };
}

export default async function MagazineArticlePage(props: Params) {
  const params = await props.params;
  if (!isLocale(params.locale)) notFound();
  const dict = getDictionary(params.locale);
  const post = await serverGet<Post>(`/posts/${params.slug}`);
  if (!post) notFound();

  return (
    <PageShell
      locale={params.locale}
      dict={dict}
      title={pickLocalized(post.title, params.locale)}
      subtitle={pickLocalized(post.excerpt, params.locale)}
      crumbs={[{ label: dict.support.magazine, href: localePath(params.locale, '/magazine') }]}
      narrow
    >
      <p className="mb-6 text-[11.5px] text-ink-faint">{formatDate(post.publishedAt, params.locale)}</p>

      {post.coverImage && (
        <div className="relative mb-8 aspect-[16/9] w-full overflow-hidden rounded-tile bg-surface-soft">
          <Image
            src={post.coverImage}
            alt={pickLocalized(post.title, params.locale)}
            fill
            sizes="(max-width: 1024px) 100vw, 768px"
            className="object-cover"
          />
        </div>
      )}

      <article className="whitespace-pre-line text-[14px] leading-[1.95] text-ink-muted">
        {pickLocalized(post.body, params.locale)}
      </article>
    </PageShell>
  );
}
