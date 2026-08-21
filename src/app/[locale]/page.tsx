import { serverGet, serverGetPaged } from '@/lib/api/client';
import { getDictionary, localePath, pickLocalized, type Locale } from '@/lib/i18n';
import { ProductCarousel } from '@/components/product/ProductCard';
import { HeroSlider } from '@/components/home/HeroSlider';
import { CollectionTabs } from '@/components/home/CollectionTabs';
import {
  AwardBand,
  CategoryCircles,
  HomeSectionHeader,
  ImageRail,
  MagazineStrip,
  PhotoGallery,
  QuickBanner,
  SubscriptionTeaser,
} from '@/components/home/HomeSections';
import type { Collection, Post, Product, StoreSettings } from '@/types';

export const revalidate = 120;

export default async function HomePage({ params }: { params: { locale: Locale } }) {
  const locale = params.locale;
  const dict = getDictionary(locale);

  // Everything the home page paints is fetched on the server so the first paint
  // is complete HTML; client hooks only take over for interaction.
  const [settings, collections, newArrivals, bestSellers, magazine] = await Promise.all([
    serverGet<StoreSettings>('/settings'),
    serverGet<Collection[]>('/collections', { home: true }),
    serverGetPaged<Product>('/products/new', { limit: 12 }),
    serverGetPaged<Product>('/products/best', { limit: 12 }),
    serverGetPaged<Post>('/posts', { type: 'magazine', limit: 3 }),
  ]);

  const slides = settings?.heroSlides ?? [];
  const tiles = settings?.themeTiles ?? [];
  const counters = settings?.counters ?? { reviews: 0, deliveries: 0, awardYears: 0 };
  const all = collections ?? [];

  const bySlug = (slug: string) => all.filter((collection) => collection.slug === slug);
  const trend = all.filter((collection) => ['season-picks', 'florist-picks'].includes(collection.slug));
  const recommended = all.filter((collection) =>
    ['florist-picks', 'flower-of-the-month', 'flowers-and-gifts', 'newborn-gifts'].includes(collection.slug),
  );

  const galleryImages = [...newArrivals.items, ...bestSellers.items]
    .map((product) => product.thumbnail ?? product.images?.[0]?.url)
    .filter((url): url is string => Boolean(url))
    .slice(0, 10);

  return (
    <>
      <HeroSlider slides={slides} locale={locale} ctaFallback={dict.common.seeAll} />

      <CategoryCircles tiles={tiles} locale={locale} />

      {/* new arrivals run edge to edge, artwork only, exactly like the reference */}
      {newArrivals.items.length > 0 && (
        <section className="py-10 lg:py-14">
          <div className="mx-auto w-full max-w-[1400px] px-4">
            <HomeSectionHeader
              title={dict.home.newArrivals}
              href={localePath(locale, '/new')}
              moreLabel={`${dict.home.newArrivals} ${dict.common.more} →`}
            />
          </div>
          <ImageRail
            locale={locale}
            items={newArrivals.items.map((product) => ({
              slug: product.slug,
              image: product.thumbnail ?? product.images?.[0]?.url,
              alt: pickLocalized(product.name, locale),
            }))}
          />
        </section>
      )}

      {trend.length > 0 && (
        <CollectionTabs title={dict.home.trend} collections={trend} locale={locale} dict={dict} />
      )}

      {bestSellers.items.length > 0 && (
        <section className="mx-auto w-full max-w-[1400px] px-4 py-10 lg:py-14">
          <HomeSectionHeader
            title={dict.home.bestSellers}
            href={`${localePath(locale, '/catalog/flower-gifts')}?sort=popular`}
            moreLabel={`${dict.common.seeAll} →`}
          />
          <ProductCarousel products={bestSellers.items} locale={locale} dict={dict} />
        </section>
      )}

      <AwardBand counters={counters} locale={locale} dict={dict} />

      <PhotoGallery images={galleryImages} title={dict.home.galleryTitle} />

      {recommended.length > 0 && (
        <CollectionTabs
          title={dict.home.floristPicks}
          collections={recommended}
          locale={locale}
          dict={dict}
          layout="grid"
          centered
        />
      )}

      <QuickBanner locale={locale} dict={dict} />

      {bySlug('flowers-and-gifts').length > 0 && (
        <CollectionTabs
          title={dict.home.gifts}
          collections={bySlug('flowers-and-gifts')}
          locale={locale}
          dict={dict}
        />
      )}

      <SubscriptionTeaser locale={locale} dict={dict} />

      <MagazineStrip posts={magazine.items} locale={locale} dict={dict} />
    </>
  );
}
