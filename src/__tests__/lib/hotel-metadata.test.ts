import { describe, it, expect } from 'vitest';
import { buildHotelMetadata, fallbackHotelMetadata } from '@/lib/seo/hotel-metadata';
import { SITE_ORIGIN } from '@/lib/seo/locale';
import type { Hotel } from '@/types/hotel';

function baseHotel(overrides: Partial<Hotel> = {}): Hotel {
  return {
    id: 100,
    slug: 'aman-tokyo',
    status: 'published',
    schema_version: 1,
    name: { en: 'Aman Tokyo', kr: '아만 도쿄' },
    overview: { en: 'A serene urban sanctuary.', kr: '도심 속 안식처.' },
    images: [{ original: 'hotels/aman/1.jpg', w1200: 'https://cdn.example.com/aman-1200.jpg' }],
    ...overrides,
  };
}

describe('buildHotelMetadata fallbacks', () => {
  it('uses seo.page_title / meta_description / og_image when present', () => {
    const hotel = baseHotel({
      seo: {
        page_title: { en: 'Aman Tokyo — Luxury Stay', kr: null },
        meta_description: { en: 'Book the best rate.', kr: null },
        og_image: { original: 'og.jpg', w1200: 'https://cdn.example.com/og.jpg' },
      },
    });
    const meta = buildHotelMetadata(hotel, 'en');
    expect(meta.title).toBe('Aman Tokyo — Luxury Stay');
    expect(meta.description).toBe('Book the best rate.');
    expect(meta.openGraph?.images).toEqual([{ url: 'https://cdn.example.com/og.jpg' }]);
  });

  it('falls back to name / overview / first image when seo meta_ is absent', () => {
    const meta = buildHotelMetadata(baseHotel({ seo: null }), 'en');
    expect(meta.title).toBe('Aman Tokyo');
    expect(meta.description).toBe('A serene urban sanctuary.');
    expect(meta.openGraph?.images).toEqual([{ url: 'https://cdn.example.com/aman-1200.jpg' }]);
  });

  it('maps kr → ko for canonical hreflang and ko_KR OG locale', () => {
    const meta = buildHotelMetadata(baseHotel(), 'kr');
    expect(meta.alternates?.languages).toHaveProperty('ko');
    expect(meta.alternates?.languages).toHaveProperty('en');
    expect(meta.openGraph?.locale).toBe('ko_KR');
    expect(meta.title).toBe('아만 도쿄');
  });

  it('lets per-hotel seo.canonical_url win over the computed canonical', () => {
    const meta = buildHotelMetadata(
      baseHotel({ seo: { canonical_url: 'https://custom.example.com/stay' } }),
      'en',
    );
    expect(meta.alternates?.canonical).toBe('https://custom.example.com/stay');
    expect(meta.openGraph?.url).toBe('https://custom.example.com/stay');
  });

  it('computes /hotel/{slug} canonical on the site origin when no override', () => {
    const meta = buildHotelMetadata(baseHotel(), 'en');
    expect(meta.alternates?.canonical).toBe(`${SITE_ORIGIN}/hotel/aman-tokyo`);
  });

  it('emits robots noindex for a non-published (draft) hotel', () => {
    const draft = buildHotelMetadata(baseHotel({ status: 'draft' }), 'en');
    expect(draft.robots).toEqual({ index: false, follow: false });
    const published = buildHotelMetadata(baseHotel({ status: 'published' }), 'en');
    expect(published.robots).toBeUndefined();
  });
});

describe('fallbackHotelMetadata', () => {
  it('returns a canonical-only metadata (no title leak) on fetch failure', () => {
    const meta = fallbackHotelMetadata('missing-hotel');
    expect(meta.alternates?.canonical).toBe('/hotel/missing-hotel');
    expect(meta.title).toBeUndefined();
  });
});
