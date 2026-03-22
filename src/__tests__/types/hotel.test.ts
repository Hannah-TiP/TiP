import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getImageUrl, getLocalizedText } from '@/types/common';
import { getHotelCoordinates, getHotelExternalLink, getHotelImages } from '@/types/hotel';
import type { Hotel } from '@/types/hotel';

describe('getLocalizedText', () => {
  it('returns preferred language when available', () => {
    expect(getLocalizedText({ en: 'Aman Tokyo', kr: '아만 도쿄' }, 'kr')).toBe('아만 도쿄');
  });

  it('falls back to the other language', () => {
    expect(getLocalizedText({ en: 'Aman Tokyo', kr: null }, 'kr')).toBe('Aman Tokyo');
  });

  it('returns raw strings as-is', () => {
    expect(getLocalizedText('Aman Tokyo')).toBe('Aman Tokyo');
  });

  it('returns empty string for missing value', () => {
    expect(getLocalizedText(undefined)).toBe('');
  });
});

describe('localized address rendering', () => {
  const baseHotel: Hotel = {
    id: 1,
    slug: 'aman-tokyo',
    status: 'published',
    city_id: 1,
    schema_version: 1,
  };

  it('returns localized address', () => {
    const hotel = { ...baseHotel, address: { en: 'Tokyo, Japan', kr: '도쿄, 일본' } };
    expect(getLocalizedText(hotel.address, 'kr')).toBe('도쿄, 일본');
  });

  it('returns empty string without address', () => {
    expect(getLocalizedText(baseHotel.address)).toBe('');
  });
});

describe('getImageUrl', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_S3_ENDPOINT', 'https://bucket.s3.amazonaws.com');
  });

  it('returns placeholder for undefined', () => {
    expect(getImageUrl(undefined)).toBe('/placeholder.jpg');
  });

  it('returns full URL as-is', () => {
    expect(getImageUrl('https://example.com/img.jpg')).toBe('https://example.com/img.jpg');
  });

  it('converts image object to full URL', () => {
    expect(getImageUrl({ original: 'tip/hotel/img.jpg' })).toBe(
      'https://bucket.s3.amazonaws.com/tip/hotel/img.jpg',
    );
  });

  it('prefers resized variants when present', () => {
    expect(
      getImageUrl({
        original: 'tip/hotel/original.jpg',
        w1200: 'tip/hotel/w1200.jpg',
      }),
    ).toBe('https://bucket.s3.amazonaws.com/tip/hotel/w1200.jpg');
  });
});

describe('getHotelImages', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_S3_ENDPOINT', 'https://bucket.s3.amazonaws.com');
  });

  const baseHotel: Hotel = {
    id: 1,
    slug: 'aman-tokyo',
    status: 'published',
    city_id: 1,
    schema_version: 1,
  };

  it('returns placeholder array when no images', () => {
    expect(getHotelImages(baseHotel)).toEqual(['/placeholder.jpg']);
  });

  it('converts hotel image objects to URLs', () => {
    const hotel = {
      ...baseHotel,
      images: [{ original: 'a.jpg' }, { original: 'b.jpg' }],
    };
    expect(getHotelImages(hotel)).toEqual([
      'https://bucket.s3.amazonaws.com/a.jpg',
      'https://bucket.s3.amazonaws.com/b.jpg',
    ]);
  });
});

describe('hotel helpers', () => {
  const hotel: Hotel = {
    id: 1,
    slug: 'aman-tokyo',
    status: 'published',
    city_id: 1,
    schema_version: 1,
    geo: { lat: 35.68, lng: 139.76 },
    external_links: [
      { link_type: 'google_map', url: 'https://maps.google.com/example' },
      { link_type: 'official_website', url: 'https://www.aman.com/hotels/aman-tokyo' },
    ],
  };

  it('returns hotel coordinates', () => {
    expect(getHotelCoordinates(hotel)).toEqual({ lat: 35.68, lng: 139.76 });
  });

  it('returns matching external link', () => {
    expect(getHotelExternalLink(hotel, 'google_map')).toBe('https://maps.google.com/example');
  });
});
