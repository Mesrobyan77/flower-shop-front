import Image from 'next/image';
import Link from 'next/link';
import { serverGetPaged } from '@/lib/api/client';
import { getDictionary, localePath, pickLocalized, type Locale } from '@/lib/i18n';
import { PageShell } from '@/components/layout/PageShell';
import { EmptyState } from '@/components/ui/Feedback';
import { formatDate } from '@/lib/utils';
import type { Post } from '@/types';

export const revalidate = 300;

export default async function MagazinePage({ params }: { params: { locale: Locale } }) {
  const dict = getDictionary(params.locale);
  const posts = await serverGetPaged<Post>('/posts', { type: 'magazine', limit: 24 });

  return (
    <PageShell locale={params.locale} dict={dict} title={dict.support.magazine}>
      {posts.items.length === 0 ? (
        <EmptyState title={dict.common.empty} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {posts.items.map((post) => (
            <Link
              key={post.id}
              href={localePath(params.locale, `/magazine/${post.slug}`)}
              className="group flex flex-col"
            >
              <span className="relative block aspect-[16/10] overflow-hidden rounded-tile bg-surface-soft">
                {post.coverImage && (
                  <Image
                    src={post.coverImage}
                    alt={pickLocalized(post.title, params.locale)}
                    fill
                    sizes="(max-width: 768px) 100vw, 400px"
                    className="object-cover transition-transform duration-[600ms] ease-out group-hover:scale-105"
                  />
                )}
              </span>
              <span className="mt-3 text-[11px] text-ink-faint">{formatDate(post.publishedAt, params.locale)}</span>
              <h2 className="mt-1 line-clamp-2 text-[15px] font-medium leading-snug text-ink transition-colors duration-fast group-hover:text-brand">
                {pickLocalized(post.title, params.locale)}
              </h2>
              {post.excerpt && (
                <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-ink-soft">
                  {pickLocalized(post.excerpt, params.locale)}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
