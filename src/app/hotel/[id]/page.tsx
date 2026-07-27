import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import HotelDetailIsland from '@/components/hotel/HotelDetailIsland';
import HotelJsonLd from '@/components/hotel/HotelJsonLd';
import { resolveServerLanguage } from '@/lib/detect-language';
import { absoluteUrl } from '@/lib/seo/locale';
import { buildHotelMetadata, fallbackHotelMetadata } from '@/lib/seo/hotel-metadata';
import {
  getHotelBySlugServer,
  getHotelMagazineArticlesServer,
  getHotelReviewAggregateServer,
  getHotelReviewsServer,
} from '@/lib/seo/hotel-fetch';

async function resolveLang() {
  const acceptLanguage = (await headers()).get('accept-language');
  return resolveServerLanguage(acceptLanguage);
}

/**
 * SEO metadata for the hotel detail page. Server-fetches the hotel by slug
 * (cached — shared with the JSON-LD + shell below), then builds
 * title/description/canonical/OG/Twitter with the seo_/og_image fallbacks.
 * Degrades to a minimal canonical-only fallback when the fetch fails / 404s.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id: slug } = await params;
  const lang = await resolveLang();
  const hotel = await getHotelBySlugServer(slug, lang);

  if (!hotel) {
    return fallbackHotelMetadata(slug);
  }

  return buildHotelMetadata(hotel, lang);
}

/**
 * Server Component shell for the hotel detail page.
 *
 * A thin server shell around a 'use client' content island. This shell:
 *  - server-fetches the hotel by slug (cached, shared with generateMetadata),
 *  - `notFound()`s an unknown slug (real 404),
 *  - emits the server-rendered JSON-LD stack (Hotel + FAQPage +
 *    AggregateRating/Review + BreadcrumbList) from the SAME cached data, and
 *  - passes the hotel + featured magazine articles into the island.
 *
 * The island still owns the visible page's interactive logic (booking prefill,
 * auto-resume, session gate) and language-switch re-fetch; this shell does not
 * touch it.
 */
export default async function HotelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: slug } = await params;
  const lang = await resolveLang();
  const hotel = await getHotelBySlugServer(slug, lang);

  if (!hotel) {
    notFound();
  }

  const [magazine, aggregate, reviews] = await Promise.all([
    getHotelMagazineArticlesServer(hotel.id, lang),
    getHotelReviewAggregateServer(hotel.id),
    getHotelReviewsServer(hotel.id),
  ]);

  const canonicalUrl = hotel.seo?.canonical_url || absoluteUrl(`/hotel/${hotel.slug}`);

  return (
    <>
      <HotelJsonLd
        hotel={hotel}
        lang={lang}
        canonicalUrl={canonicalUrl}
        averageRating={aggregate.average_rating}
        reviewCount={aggregate.review_count}
        reviews={reviews}
        countryPillar={magazine.country_pillar}
      />
      <HotelDetailIsland slug={slug} initialHotel={hotel} featured={magazine.featured} />
    </>
  );
}
