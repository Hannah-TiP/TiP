import { cache } from 'react';
import type { Lang } from '@/contexts/LanguageContext';
import type { Hotel } from '@/types/hotel';
import type { MagazineHotelArticles } from '@/types/magazine-hotel';
import type { ReviewAggregate, ReviewListResponse, ReviewWithAuthor } from '@/types/review';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

/**
 * Server-side fetch of a hotel by slug, wrapped in React `cache()` so
 * `generateMetadata`, the JSON-LD server component, and the page shell share a
 * SINGLE backend request per render (no double fetch).
 *
 * Hits the backend directly (not the /api proxy — that is browser-only) with
 * the `lang` header the by-slug endpoint expects (`en` / `kr`, NOT a BCP-47
 * tag). Returns `null` on any failure (404, network, malformed body) so callers
 * degrade gracefully — a missing/failed hotel must never 500 the page.
 */
export const getHotelBySlugServer = cache(
  async (slug: string, lang: Lang): Promise<Hotel | null> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v2/hotels/by-slug/${encodeURIComponent(slug)}`,
        {
          headers: {
            'Content-Type': 'application/json',
            lang,
          },
        },
      );

      if (!response.ok) return null;

      const body = (await response.json()) as { data?: Hotel };
      return body.data ?? null;
    } catch {
      return null;
    }
  },
);

/**
 * Server-side fetch of the hotel→magazine bridge (featured articles + country
 * pillar). Takes the numeric hotel id (the bridge endpoint keys on id, not
 * slug). Cached so the JSON-LD (breadcrumb pillar) and the "From the Magazine"
 * section share one request. Returns an empty payload on any failure so the
 * page never breaks.
 */
export const getHotelMagazineArticlesServer = cache(
  async (hotelId: number, lang: Lang): Promise<MagazineHotelArticles> => {
    const empty: MagazineHotelArticles = { featured: [], country_pillar: null };
    try {
      const response = await fetch(`${API_BASE_URL}/api/v2/magazine/hotels/${hotelId}/articles`, {
        headers: {
          'Content-Type': 'application/json',
          Language: lang,
        },
      });

      if (!response.ok) return empty;

      const body = (await response.json()) as { data?: MagazineHotelArticles };
      return body.data ?? empty;
    } catch {
      return empty;
    }
  },
);

/**
 * Server-side batch review aggregate for a single hotel — resolves
 * `{ average_rating, review_count }`. Uses the public aggregates endpoint (the
 * same one the dream-hotels map uses). Returns a zero aggregate on any failure.
 */
export const getHotelReviewAggregateServer = cache(
  async (hotelId: number): Promise<ReviewAggregate> => {
    const zero: ReviewAggregate = { average_rating: null, review_count: 0 };
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v2/reviews/aggregates?entity_type=hotel&entity_ids=${hotelId}`,
        { headers: { 'Content-Type': 'application/json' } },
      );

      if (!response.ok) return zero;

      const body = (await response.json()) as {
        data?: Record<string, ReviewAggregate>;
      };
      return body.data?.[String(hotelId)] ?? zero;
    } catch {
      return zero;
    }
  },
);

/**
 * Server-side fetch of a hotel's public reviews (author-nested). Used to emit
 * the `Review` nodes inside the Hotel JSON-LD. Returns [] on any failure.
 */
export const getHotelReviewsServer = cache(async (hotelId: number): Promise<ReviewWithAuthor[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v2/reviews/by-entity/hotel/${hotelId}`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) return [];

    const body = (await response.json()) as { data?: ReviewListResponse };
    return body.data?.reviews ?? [];
  } catch {
    return [];
  }
});
