import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  extractCountryFromAddress,
  formatLocation,
  getImageUrl,
  getHotelImages,
} from '@/types/hotel';
import type { Hotel } from '@/types/hotel';

describe('extractCountryFromAddress', () => {
  it('extracts country from full address', () => {
    expect(extractCountryFromAddress('112 Rue du Faubourg, 75008 Paris, France')).toBe('France');
  });

  it('returns empty string for undefined', () => {
    expect(extractCountryFromAddress(undefined)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(extractCountryFromAddress('')).toBe('');
  });

  it('returns the whole string if no comma', () => {
    expect(extractCountryFromAddress('France')).toBe('France');
  });

  it('trims whitespace', () => {
    expect(extractCountryFromAddress('Paris,  France  ')).toBe('France');
  });
});

describe('formatLocation', () => {
  const baseHotel: Hotel = { id: 1, name: 'Test', city_id: 1, language: 'en' };

  it('returns "City, Country" when both present', () => {
    const hotel = { ...baseHotel, city: { id: 1, name: 'Paris' }, address: 'Rue X, France' };
    expect(formatLocation(hotel)).toBe('Paris, France');
  });

  it('returns just city when no address', () => {
    const hotel = { ...baseHotel, city: { id: 1, name: 'Paris' } };
    expect(formatLocation(hotel)).toBe('Paris');
  });

  it('returns ", Country" when no city', () => {
    const hotel = { ...baseHotel, address: 'Somewhere, Japan' };
    expect(formatLocation(hotel)).toBe(', Japan');
  });

  it('returns empty string when neither present', () => {
    expect(formatLocation(baseHotel)).toBe('');
  });
});

describe('getImageUrl', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_S3_ENDPOINT', 'https://bucket.s3.amazonaws.com');
  });

  it('returns placeholder for undefined', () => {
    expect(getImageUrl(undefined)).toBe('/placeholder.jpg');
  });

  it('returns full http URL as-is', () => {
    expect(getImageUrl('http://example.com/img.jpg')).toBe('http://example.com/img.jpg');
  });

  it('returns full https URL as-is', () => {
    expect(getImageUrl('https://example.com/img.jpg')).toBe('https://example.com/img.jpg');
  });

  it('converts S3 path to full URL', () => {
    expect(getImageUrl('tip/hotel/img.jpg')).toBe(
      'https://bucket.s3.amazonaws.com/tip/hotel/img.jpg',
    );
  });

  it('strips leading slash to avoid double slash', () => {
    expect(getImageUrl('/tip/hotel/img.jpg')).toBe(
      'https://bucket.s3.amazonaws.com/tip/hotel/img.jpg',
    );
  });

  it('returns placeholder when S3 endpoint not configured', () => {
    vi.stubEnv('NEXT_PUBLIC_S3_ENDPOINT', '');
    expect(getImageUrl('tip/img.jpg')).toBe('/placeholder.jpg');
  });
});

describe('getHotelImages', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_S3_ENDPOINT', 'https://bucket.s3.amazonaws.com');
  });

  const baseHotel: Hotel = { id: 1, name: 'Test', city_id: 1, language: 'en' };

  it('returns placeholder array when no images', () => {
    expect(getHotelImages(baseHotel)).toEqual(['/placeholder.jpg']);
  });

  it('returns placeholder array for empty image array', () => {
    expect(getHotelImages({ ...baseHotel, image: [] })).toEqual(['/placeholder.jpg']);
  });

  it('converts all S3 paths to full URLs', () => {
    const hotel = { ...baseHotel, image: ['a.jpg', 'b.jpg'] };
    expect(getHotelImages(hotel)).toEqual([
      'https://bucket.s3.amazonaws.com/a.jpg',
      'https://bucket.s3.amazonaws.com/b.jpg',
    ]);
  });
});
