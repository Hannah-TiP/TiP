/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-unused-vars */
import type { AnchorHTMLAttributes, ImgHTMLAttributes } from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import en from '@/translations/en.json';
import { apiClient } from '@/lib/api-client';
import type { Hotel } from '@/types/hotel';
import type { Activity } from '@/types/activity';
import type { Restaurant } from '@/types/restaurant';
import type { City } from '@/types/location';
import type { PaginatedResult } from '@/types/common';

import HotelDetailPage from '@/app/hotel/[id]/page';
import ActivityDetailPage from '@/app/activity/[id]/page';
import RestaurantDetailPage from '@/app/restaurant/[id]/page';
import MoreDreamsPage from '@/app/more-dreams/page';
import SignatureJourneysPage from '@/app/signature-journeys/page';
import WishlistPage from '@/app/my-page/wishlist/page';

function listPage<T>(items: T[]): PaginatedResult<T> {
  return { items, hasMore: false, total: items.length, page: 1 };
}

// Mutable so each test can flip the active language before render.
const languageState = vi.hoisted(() => ({ lang: 'en' as 'en' | 'kr' }));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    lang: languageState.lang,
    setLang: vi.fn(),
    t: (key: string) => (en as Record<string, string>)[key] ?? key,
  }),
}));

// jsdom has no IntersectionObserver; the infinite-scroll sentinels need it.
vi.stubGlobal(
  'IntersectionObserver',
  class {
    observe = vi.fn();
    disconnect = vi.fn();
    unobserve = vi.fn();
    takeRecords = vi.fn();
  },
);

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'aman-tokyo' }),
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

vi.mock('next-auth/react', () => ({
  useSession: () => ({ status: 'unauthenticated', data: null }),
}));

vi.mock('next/image', () => ({
  default: ({
    fill: _fill,
    priority: _priority,
    sizes: _sizes,
    ...props
  }: ImgHTMLAttributes<HTMLImageElement> & {
    fill?: boolean;
    priority?: boolean;
    sizes?: string;
  }) => <img {...props} alt={props.alt} />,
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/components/Footer', () => ({ default: () => <div>Footer</div> }));
vi.mock('@/components/PreviewBanner', () => ({ default: () => null }));
vi.mock('@/components/WishlistButton', () => ({ default: () => <button>wishlist</button> }));
vi.mock('@/components/reviews/EntityReviews', () => ({ default: () => <div>reviews</div> }));

vi.mock('@/hooks/usePreviewMode', () => ({
  usePreviewMode: () => ({ isPreview: false, isAllowed: false, toggle: () => {} }),
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    getHotelBySlug: vi.fn(),
    getActivityBySlug: vi.fn(),
    getRestaurantBySlug: vi.fn(),
    getActivities: vi.fn(),
    getRestaurants: vi.fn(),
    getCities: vi.fn(),
    getWishlist: vi.fn(),
    getReviewsByEntity: vi.fn().mockResolvedValue({
      reviews: [],
      aggregate: { average_rating: null, review_count: 0 },
    }),
  },
}));

beforeEach(() => {
  languageState.lang = 'en';
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const krHotel: Hotel = {
  id: 1,
  slug: 'aman-tokyo',
  status: 'published',
  star_rating: '5',
  name: { en: null, kr: '아만 도쿄' },
  address: { en: null, kr: '도쿄 오테마치' },
  overview: { en: null, kr: '도심 속 고요한 안식처.' },
  images: [{ original: 'https://example.com/hero.jpg' }],
  benefits: [],
  rooms: [],
  features: [],
  faqs: [],
  policies: [],
  highlights: [],
  external_links: [],
  schema_version: 1,
};

const krActivity: Activity = {
  id: 1,
  slug: 'paris-private-boat',
  city_id: 10,
  category: 'sightseeing',
  kind: 'local_experience',
  status: 'published',
  name: { en: null, kr: '파리 프라이빗 보트 투어' },
  images: [{ original: 'https://example.com/boat.jpg' }],
  schema_version: 1,
};

const krRestaurant: Restaurant = {
  id: 1,
  slug: 'noma',
  city_id: 10,
  status: 'published',
  name: { en: null, kr: '노마' },
  images: [{ original: 'https://example.com/noma.jpg' }],
  schema_version: 1,
};

const krCity: City = {
  id: 10,
  name: { en: null, kr: '파리' },
  slug: 'paris',
  region_id: 1,
  status: true,
  link_services: true,
  schema_version: 1,
};

describe('Content surfaces thread the active language into their fetches (SMA-139)', () => {
  describe('hotel detail', () => {
    it('fetches with the KR language and renders KR content', async () => {
      languageState.lang = 'kr';
      vi.mocked(apiClient.getHotelBySlug).mockResolvedValue(krHotel);

      render(<HotelDetailPage />);

      await waitFor(() =>
        expect(vi.mocked(apiClient.getHotelBySlug).mock.calls.length).toBeGreaterThan(0),
      );
      expect(vi.mocked(apiClient.getHotelBySlug).mock.calls[0]).toEqual(['aman-tokyo', 'kr']);
      expect((await screen.findAllByText('아만 도쿄')).length).toBeGreaterThan(0);
    });

    it('fetches with EN when the active language is EN', async () => {
      vi.mocked(apiClient.getHotelBySlug).mockResolvedValue({
        ...krHotel,
        name: { en: 'Aman Tokyo', kr: '아만 도쿄' },
      });

      render(<HotelDetailPage />);

      await waitFor(() =>
        expect(vi.mocked(apiClient.getHotelBySlug).mock.calls.length).toBeGreaterThan(0),
      );
      expect(vi.mocked(apiClient.getHotelBySlug).mock.calls[0][1]).toBe('en');
    });
  });

  describe('activity detail', () => {
    it('fetches with the KR language and renders KR content', async () => {
      languageState.lang = 'kr';
      vi.mocked(apiClient.getActivityBySlug).mockResolvedValue(krActivity);

      render(<ActivityDetailPage />);

      await waitFor(() =>
        expect(vi.mocked(apiClient.getActivityBySlug).mock.calls.length).toBeGreaterThan(0),
      );
      expect(vi.mocked(apiClient.getActivityBySlug).mock.calls[0]).toEqual(['aman-tokyo', 'kr']);
      expect((await screen.findAllByText('파리 프라이빗 보트 투어')).length).toBeGreaterThan(0);
    });

    it('fetches with EN when the active language is EN', async () => {
      vi.mocked(apiClient.getActivityBySlug).mockResolvedValue(krActivity);

      render(<ActivityDetailPage />);

      await waitFor(() =>
        expect(vi.mocked(apiClient.getActivityBySlug).mock.calls.length).toBeGreaterThan(0),
      );
      expect(vi.mocked(apiClient.getActivityBySlug).mock.calls[0][1]).toBe('en');
    });
  });

  describe('restaurant detail', () => {
    it('fetches with the KR language and renders KR content', async () => {
      languageState.lang = 'kr';
      vi.mocked(apiClient.getRestaurantBySlug).mockResolvedValue(krRestaurant);

      render(<RestaurantDetailPage />);

      await waitFor(() =>
        expect(vi.mocked(apiClient.getRestaurantBySlug).mock.calls.length).toBeGreaterThan(0),
      );
      expect(vi.mocked(apiClient.getRestaurantBySlug).mock.calls[0]).toEqual(['aman-tokyo', 'kr']);
      expect((await screen.findAllByText('노마')).length).toBeGreaterThan(0);
    });

    it('fetches with EN when the active language is EN', async () => {
      vi.mocked(apiClient.getRestaurantBySlug).mockResolvedValue(krRestaurant);

      render(<RestaurantDetailPage />);

      await waitFor(() =>
        expect(vi.mocked(apiClient.getRestaurantBySlug).mock.calls.length).toBeGreaterThan(0),
      );
      expect(vi.mocked(apiClient.getRestaurantBySlug).mock.calls[0][1]).toBe('en');
    });
  });

  describe('more-dreams', () => {
    it('fetches activities, restaurants, and cities with the active KR language', async () => {
      languageState.lang = 'kr';
      vi.mocked(apiClient.getActivities).mockResolvedValue(listPage([krActivity]));
      vi.mocked(apiClient.getRestaurants).mockResolvedValue(listPage([krRestaurant]));
      vi.mocked(apiClient.getCities).mockResolvedValue([krCity]);

      render(<MoreDreamsPage />);

      await waitFor(() => {
        expect(vi.mocked(apiClient.getActivities).mock.calls.length).toBeGreaterThan(0);
        expect(vi.mocked(apiClient.getRestaurants).mock.calls.length).toBeGreaterThan(0);
        expect(vi.mocked(apiClient.getCities).mock.calls.length).toBeGreaterThan(0);
      });

      expect(vi.mocked(apiClient.getActivities).mock.calls[0][0]?.language).toBe('kr');
      expect(vi.mocked(apiClient.getRestaurants).mock.calls[0][0]?.language).toBe('kr');
      expect(vi.mocked(apiClient.getCities).mock.calls[0][0]).toBe('kr');
    });

    it('fetches with EN when the active language is EN', async () => {
      vi.mocked(apiClient.getActivities).mockResolvedValue(listPage([krActivity]));
      vi.mocked(apiClient.getRestaurants).mockResolvedValue(listPage([krRestaurant]));
      vi.mocked(apiClient.getCities).mockResolvedValue([krCity]);

      render(<MoreDreamsPage />);

      await waitFor(() =>
        expect(vi.mocked(apiClient.getActivities).mock.calls.length).toBeGreaterThan(0),
      );
      expect(vi.mocked(apiClient.getActivities).mock.calls[0][0]?.language).toBe('en');
    });
  });

  describe('signature-journeys', () => {
    it('fetches packages and cities with the active KR language', async () => {
      languageState.lang = 'kr';
      vi.mocked(apiClient.getActivities).mockResolvedValue(
        listPage([{ ...krActivity, kind: 'package' }]),
      );
      vi.mocked(apiClient.getCities).mockResolvedValue([krCity]);

      render(<SignatureJourneysPage />);

      await waitFor(() =>
        expect(vi.mocked(apiClient.getActivities).mock.calls.length).toBeGreaterThan(0),
      );
      expect(vi.mocked(apiClient.getActivities).mock.calls[0][0]?.language).toBe('kr');
      expect(vi.mocked(apiClient.getCities).mock.calls[0][0]).toBe('kr');
    });

    it('fetches with EN when the active language is EN', async () => {
      vi.mocked(apiClient.getActivities).mockResolvedValue(
        listPage([{ ...krActivity, kind: 'package' }]),
      );
      vi.mocked(apiClient.getCities).mockResolvedValue([krCity]);

      render(<SignatureJourneysPage />);

      await waitFor(() =>
        expect(vi.mocked(apiClient.getActivities).mock.calls.length).toBeGreaterThan(0),
      );
      expect(vi.mocked(apiClient.getActivities).mock.calls[0][0]?.language).toBe('en');
    });
  });

  describe('wishlist', () => {
    it('fetches the wishlist with the active KR language and renders KR names', async () => {
      languageState.lang = 'kr';
      vi.mocked(apiClient.getWishlist).mockResolvedValue([krHotel]);

      render(<WishlistPage />);

      await waitFor(() =>
        expect(vi.mocked(apiClient.getWishlist).mock.calls.length).toBeGreaterThan(0),
      );
      expect(vi.mocked(apiClient.getWishlist).mock.calls[0][0]).toBe('kr');
      expect(await screen.findByText('아만 도쿄')).toBeTruthy();
    });

    it('fetches the wishlist with EN when the active language is EN', async () => {
      vi.mocked(apiClient.getWishlist).mockResolvedValue([krHotel]);

      render(<WishlistPage />);

      await waitFor(() =>
        expect(vi.mocked(apiClient.getWishlist).mock.calls.length).toBeGreaterThan(0),
      );
      expect(vi.mocked(apiClient.getWishlist).mock.calls[0][0]).toBe('en');
    });
  });
});
