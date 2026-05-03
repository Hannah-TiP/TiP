/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-unused-vars */
import type { AnchorHTMLAttributes, ImgHTMLAttributes } from 'react';
import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import enTranslations from '@/translations/en.json';
import { apiClient } from '@/lib/api-client';
import type { Hotel } from '@/types/hotel';

// ── Mocks: read by the page on mount ─────────────────────────────────────────

const pushMock = vi.fn();
const replaceMock = vi.fn();
const searchParamsRef: { current: URLSearchParams } = { current: new URLSearchParams() };
const sessionRef: { current: 'authenticated' | 'unauthenticated' | 'loading' } = {
  current: 'unauthenticated',
};

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'aman-tokyo' }),
  useRouter: () => ({ push: pushMock, replace: replaceMock, back: vi.fn() }),
  useSearchParams: () => searchParamsRef.current,
}));

vi.mock('next-auth/react', () => ({
  useSession: () => ({ status: sessionRef.current, data: null }),
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => (enTranslations as Record<string, string>)[key] ?? key,
    lang: 'en',
    setLang: () => {},
  }),
}));

vi.mock('next/image', () => ({
  default: ({
    fill: _fill,
    priority: _priority,
    ...props
  }: ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; priority?: boolean }) => (
    <img {...props} alt={props.alt} />
  ),
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

vi.mock('@/components/TopBar', () => ({ default: () => <div>TopBar</div> }));
vi.mock('@/components/Footer', () => ({ default: () => <div>Footer</div> }));
vi.mock('@/components/WishlistButton', () => ({ default: () => <button>Wishlist</button> }));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    getHotelBySlug: vi.fn(),
    createTripFromHotel: vi.fn(),
  },
}));

const baseHotel: Hotel = {
  id: 42,
  slug: 'aman-tokyo',
  status: 'published',
  star_rating: '5',
  city_id: 1,
  brand_id: 1,
  name: { en: 'Aman Tokyo', kr: '아만 도쿄' },
  address: { en: 'Tokyo, Japan', kr: '일본 도쿄' },
  overview: { en: 'A serene urban sanctuary.', kr: '도심 속 고요한 안식처.' },
  check_in_time: '15:00',
  check_out_time: '12:00',
  geo: { lat: 35.6875, lng: 139.763 },
  images: [],
  benefits: [],
  rooms: [],
  features: [],
  faqs: [],
  policies: [],
  highlights: [],
  external_links: [],
  schema_version: 1,
};

beforeEach(() => {
  pushMock.mockReset();
  replaceMock.mockReset();
  searchParamsRef.current = new URLSearchParams();
  sessionRef.current = 'unauthenticated';
  vi.mocked(apiClient.getHotelBySlug).mockResolvedValue(baseHotel);
  vi.mocked(apiClient.createTripFromHotel).mockReset();
});

afterEach(() => {
  cleanup();
});

describe('HotelDetailPage — auto-resume after sign-in', () => {
  it('fires the Reserve handler once when ?reserve=1 + checkin/checkout + authed, then cleans the URL', async () => {
    const { default: HotelDetailPage } = await import('@/app/hotel/[id]/page');

    sessionRef.current = 'authenticated';
    searchParamsRef.current = new URLSearchParams(
      'reserve=1&checkin=2099-06-10&checkout=2099-06-13',
    );
    vi.mocked(apiClient.createTripFromHotel).mockResolvedValueOnce({
      trip: { id: 77 } as never,
      session: { id: 1 } as never,
      trip_version_id: 5,
    });

    render(<HotelDetailPage />);

    await waitFor(() => {
      expect(apiClient.createTripFromHotel).toHaveBeenCalledTimes(1);
    });
    expect(apiClient.createTripFromHotel).toHaveBeenCalledWith({
      hotel_id: 42,
      start_date: '2099-06-10',
      end_date: '2099-06-13',
    });
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/concierge?trip_id=77');
    });
    expect(replaceMock).toHaveBeenCalledWith('/hotel/aman-tokyo');
  });

  it('fires Ask Concierge once when ?ask=1 + authed, even without dates', async () => {
    const { default: HotelDetailPage } = await import('@/app/hotel/[id]/page');

    sessionRef.current = 'authenticated';
    searchParamsRef.current = new URLSearchParams('ask=1');
    vi.mocked(apiClient.createTripFromHotel).mockResolvedValueOnce({
      trip: { id: 88 } as never,
      session: { id: 1 } as never,
      trip_version_id: 5,
    });

    render(<HotelDetailPage />);

    await waitFor(() => {
      expect(apiClient.createTripFromHotel).toHaveBeenCalledTimes(1);
    });
    expect(apiClient.createTripFromHotel).toHaveBeenCalledWith({ hotel_id: 42 });
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/concierge?trip_id=88');
    });
  });

  it('does not auto-fire when the user is unauthed (post-redirect mount before auth lands)', async () => {
    const { default: HotelDetailPage } = await import('@/app/hotel/[id]/page');

    sessionRef.current = 'unauthenticated';
    searchParamsRef.current = new URLSearchParams(
      'reserve=1&checkin=2099-06-10&checkout=2099-06-13',
    );

    render(<HotelDetailPage />);

    // Wait one tick — verify the handler never ran.
    await waitFor(() => {
      expect(apiClient.getHotelBySlug).toHaveBeenCalled();
    });
    expect(apiClient.createTripFromHotel).not.toHaveBeenCalled();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it('does not auto-fire when authed but no action param is present', async () => {
    const { default: HotelDetailPage } = await import('@/app/hotel/[id]/page');

    sessionRef.current = 'authenticated';
    searchParamsRef.current = new URLSearchParams();

    render(<HotelDetailPage />);

    await waitFor(() => {
      expect(apiClient.getHotelBySlug).toHaveBeenCalled();
    });
    expect(apiClient.createTripFromHotel).not.toHaveBeenCalled();
    expect(replaceMock).not.toHaveBeenCalled();
  });
});
