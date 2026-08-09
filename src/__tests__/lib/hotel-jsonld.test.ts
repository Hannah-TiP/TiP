import { describe, it, expect } from 'vitest';
import {
  buildHotelJsonLd,
  buildHotelFaqJsonLd,
  buildHotelReviewJsonLd,
  buildHotelBreadcrumbJsonLd,
  buildHotelJsonLdStack,
  MAX_JSONLD_REVIEWS,
} from '@/lib/seo/hotel-jsonld';
import { getLocalizedText } from '@/types/common';
import { SITE_ORIGIN } from '@/lib/seo/locale';
import type { Hotel } from '@/types/hotel';
import type { MagazineHotelArticleRef } from '@/types/magazine-hotel';
import type { ReviewWithAuthor } from '@/types/review';

const CANONICAL = `${SITE_ORIGIN}/hotel/aman-tokyo`;

function baseHotel(overrides: Partial<Hotel> = {}): Hotel {
  return {
    id: 100,
    slug: 'aman-tokyo',
    status: 'published',
    schema_version: 1,
    star_rating: '5',
    name: { en: 'Aman Tokyo', kr: '아만 도쿄' },
    address: { en: '1-5-6 Otemachi, Tokyo', kr: '도쿄 오테마치' },
    overview: { en: 'A serene urban sanctuary.', kr: '도심 속 안식처.' },
    contact: { website_url: 'https://contact.example.com' },
    external_links: [{ link_type: 'official_website', url: 'https://aman.com/tokyo' }],
    images: [{ original: 'hotels/aman/1.jpg' }, { original: 'hotels/aman/2.jpg' }],
    features: [
      { feature_type: 'amenity', name: { en: 'Spa', kr: '스파' } },
      { feature_type: 'facility', name: { en: 'Pool', kr: '수영장' } },
    ],
    faqs: [{ question: { en: 'Check-in time?', kr: null }, answer: { en: '3 PM', kr: null } }],
    ...overrides,
  };
}

function review(id: number, rating: number, comment: string | null): ReviewWithAuthor {
  return {
    review: {
      id,
      author_user_id: id,
      trip_id: 1,
      entity_type: 'hotel',
      entity_id: 100,
      rating,
      locked_at: null,
      deleted_at: null,
      comment,
      photos: [],
      schema_version: 1,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: null,
    },
    author: { id, first_name: 'Jane', last_name: 'Doe' },
  };
}

describe('buildHotelJsonLd', () => {
  it('binds name/url/image/description/address and starRating', () => {
    const node = buildHotelJsonLd(baseHotel(), 'en', CANONICAL);
    expect(node['@type']).toBe('Hotel');
    expect(node.name).toBe('Aman Tokyo');
    expect(node.url).toBe(CANONICAL);
    expect(node.description).toBe('A serene urban sanctuary.');
    expect(node.address).toBe('1-5-6 Otemachi, Tokyo');
    expect(Array.isArray(node.image)).toBe(true);
    expect((node.image as string[]).length).toBe(2);
    expect(node.starRating).toEqual({ '@type': 'Rating', ratingValue: '5' });
  });

  it('derives amenityFeature from features and sameAs from website links', () => {
    const node = buildHotelJsonLd(baseHotel(), 'en', CANONICAL);
    expect(node.amenityFeature).toEqual([
      { '@type': 'LocationFeatureSpecification', name: 'Spa' },
      { '@type': 'LocationFeatureSpecification', name: 'Pool' },
    ]);
    expect(node.sameAs).toEqual(['https://aman.com/tokyo', 'https://contact.example.com']);
  });

  it('omits empty keys (no images / features / links / overview / address)', () => {
    const node = buildHotelJsonLd(
      baseHotel({
        images: null,
        features: null,
        external_links: null,
        contact: null,
        overview: null,
        address: null,
        star_rating: null,
      }),
      'en',
      CANONICAL,
    );
    expect(node.image).toBeUndefined();
    expect(node.amenityFeature).toBeUndefined();
    expect(node.sameAs).toBeUndefined();
    expect(node.description).toBeUndefined();
    expect(node.address).toBeUndefined();
    expect(node.starRating).toBeUndefined();
  });
});

describe('buildHotelFaqJsonLd (parity with FaqAccordion getLocalizedText)', () => {
  it('emits Question/Answer using the same getLocalizedText derivation', () => {
    const hotel = baseHotel({
      faqs: [
        { question: { en: 'Q1', kr: '질문1' }, answer: { en: 'A1', kr: '답변1' } },
        { question: { en: 'Q2', kr: null }, answer: { en: 'A2', kr: null } },
      ],
    });
    const node = buildHotelFaqJsonLd(hotel, 'en');
    expect(node).not.toBeNull();
    const entities = (node!.mainEntity as Array<Record<string, unknown>>).map((q) => ({
      name: q.name,
      answer: (q.acceptedAnswer as Record<string, unknown>).text,
    }));
    // Parity by construction: JSON-LD question/answer === what FaqAccordion renders.
    expect(entities).toEqual(
      hotel.faqs!.map((f) => ({
        name: getLocalizedText(f.question, 'en'),
        answer: getLocalizedText(f.answer, 'en'),
      })),
    );
  });

  it('returns null when there are no answerable FAQs', () => {
    expect(buildHotelFaqJsonLd(baseHotel({ faqs: [] }), 'en')).toBeNull();
    expect(
      buildHotelFaqJsonLd(
        baseHotel({ faqs: [{ question: { en: 'Q', kr: null }, answer: { en: '', kr: null } }] }),
        'en',
      ),
    ).toBeNull();
  });
});

describe('buildHotelReviewJsonLd', () => {
  it('omits the entire review block when reviewCount is 0', () => {
    expect(buildHotelReviewJsonLd(baseHotel(), 'en', CANONICAL, null, 0, [])).toBeNull();
  });

  it('emits AggregateRating + Review nodes when reviews exist', () => {
    const reviews = [review(1, 5, 'Great'), review(2, 4, null)];
    const node = buildHotelReviewJsonLd(baseHotel(), 'en', CANONICAL, 4.5, 2, reviews);
    expect(node).not.toBeNull();
    expect(node!.aggregateRating).toEqual({
      '@type': 'AggregateRating',
      ratingValue: 4.5,
      reviewCount: 2,
    });
    const reviewNodes = node!.review as Array<Record<string, unknown>>;
    expect(reviewNodes.length).toBe(2);
    expect(reviewNodes[0].reviewBody).toBe('Great');
    expect((reviewNodes[0].author as Record<string, unknown>).name).toBe('Jane Doe');
    // review with null comment omits reviewBody
    expect(reviewNodes[1].reviewBody).toBeUndefined();
  });

  it('caps the emitted Review nodes at MAX_JSONLD_REVIEWS', () => {
    const many = Array.from({ length: MAX_JSONLD_REVIEWS + 5 }, (_, i) => review(i, 5, `c${i}`));
    const node = buildHotelReviewJsonLd(baseHotel(), 'en', CANONICAL, 5, many.length, many);
    expect((node!.review as unknown[]).length).toBe(MAX_JSONLD_REVIEWS);
  });
});

describe('buildHotelBreadcrumbJsonLd (country-pillar conditional)', () => {
  const pillar: MagazineHotelArticleRef = {
    id: 9,
    type: 'destination',
    slug: 'japan-guide',
    title: { en: 'Japan', kr: '일본' },
    hero_image: null,
  };

  it('includes the country-pillar crumb when the pillar resolves', () => {
    const node = buildHotelBreadcrumbJsonLd(baseHotel(), 'en', CANONICAL, pillar);
    const items = node.itemListElement as Array<Record<string, unknown>>;
    expect(items.map((i) => i.name)).toEqual(['Home', 'Dream Hotels', 'Japan', 'Aman Tokyo']);
    expect(items.map((i) => i.position)).toEqual([1, 2, 3, 4]);
    expect(items[2].item).toBe(`${SITE_ORIGIN}/magazine/destinations/japan-guide`);
    expect(items[3].item).toBe(CANONICAL);
  });

  it('omits the country-pillar crumb when the pillar is null', () => {
    const node = buildHotelBreadcrumbJsonLd(baseHotel(), 'en', CANONICAL, null);
    const items = node.itemListElement as Array<Record<string, unknown>>;
    expect(items.map((i) => i.name)).toEqual(['Home', 'Dream Hotels', 'Aman Tokyo']);
    expect(items.map((i) => i.position)).toEqual([1, 2, 3]);
  });
});

describe('buildHotelJsonLdStack', () => {
  it('drops the review block when there are no reviews and keeps FAQ + breadcrumb', () => {
    const docs = buildHotelJsonLdStack({
      hotel: baseHotel(),
      lang: 'en',
      canonicalUrl: CANONICAL,
      averageRating: null,
      reviewCount: 0,
      reviews: [],
      countryPillar: null,
    });
    const types = docs.map((d) => d['@type']);
    expect(types).toEqual(['Hotel', 'FAQPage', 'BreadcrumbList']);
  });

  it('includes the review block when reviews exist', () => {
    const docs = buildHotelJsonLdStack({
      hotel: baseHotel(),
      lang: 'en',
      canonicalUrl: CANONICAL,
      averageRating: 4.5,
      reviewCount: 2,
      reviews: [review(1, 5, 'x'), review(2, 4, 'y')],
      countryPillar: null,
    });
    const withReview = docs.filter((d) => 'aggregateRating' in d);
    expect(withReview.length).toBe(1);
  });
});
