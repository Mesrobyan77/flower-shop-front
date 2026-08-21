import Image from 'next/image';
import { serverGetPaged } from '@/lib/api/client';
import { getDictionary, pickLocalized, type Locale } from '@/lib/i18n';
import { PageShell } from '@/components/layout/PageShell';
import { EmptyState } from '@/components/ui/Feedback';
import type { Post } from '@/types';

export const revalidate = 300;

export default async function EventsPage({ params }: { params: { locale: Locale } }) {
  const dict = getDictionary(params.locale);
  const posts = await serverGetPaged<Post>('/posts', { type: 'event', limit: 24 });

  return (
    <PageShell locale={params.locale} dict={dict} title={dict.support.events}>
      {posts.items.length === 0 ? (
        <EmptyState title={dict.common.empty} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {posts.items.map((post) => (
            <article key={post.id} className="overflow-hidden rounded-tile border border-line">
              {post.coverImage && (
                <div className="relative aspect-[16/7] w-full bg-surface-soft">
                  <Image
                    src={post.coverImage}
                    alt={pickLocalized(post.title, params.locale)}
                    fill
                    sizes="(max-width: 768px) 100vw, 600px"
                    className="object-cover"
                  />
                </div>
              )}
              <div className="p-5">
                <h2 className="text-[15px] font-semibold text-ink-strong">
                  {pickLocalized(post.title, params.locale)}
                </h2>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
                  {pickLocalized(post.body, params.locale)}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </PageShell>
  );
}
