/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-unused-vars */
import type { AnchorHTMLAttributes, ImgHTMLAttributes } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import HotelDetailPage from '@/app/hotel/[id]/page';
import enTranslations from '@/translations/en.json';
import { apiClient } from '@/lib/api-client';
import type { Hotel } from '@/types/hotel';

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => (enTranslations as Record<string, string>)[key] ?? key,
    lang: 'en',
    setLang: () => {},
  }),
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'aman-tokyo' }),
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next-auth/react', () => ({
  useSession: () => ({ status: 'unauthenticated', data: null }),
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

vi.mock('@/components/Footer', () => ({
  default: () => <div>Footer</div>,
}));

vi.mock('@/components/WishlistButton', () => ({
  default: () => <button>Wishlist</button>,
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    getHotelBySlug: vi.fn(),
    getReviewsByEntity: vi.fn().mockResolvedValue({
      reviews: [],
      aggregate: { average_rating: null, review_count: 0 },
    }),
  },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const baseHotel: Hotel = {
  id: 1,
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
  images: [
    { original: 'https://example.com/hero.jpg' },
    { original: 'https://example.com/room.jpg' },
    { original: 'https://example.com/spa.jpg' },
  ],
  benefits: [],
  rooms: [
    { name: { en: 'Deluxe Room', kr: '디럭스룸' }, size_sqm: 76 },
    { name: { en: 'Aman Suite', kr: '아만 스위트' }, size_sqm: 129 },
  ],
  features: [
    { feature_type: 'amenity', name: { en: 'Spa', kr: '스파' }, icon: '♨️' },
    { feature_type: 'amenity', name: { en: 'Pool', kr: '수영장' }, icon: '🏊' },
  ],
  faqs: [
    {
      question: { en: 'Check-in time?', kr: '체크인 시간?' },
      answer: { en: '3:00 PM.', kr: '오후 3시.' },
    },
  ],
  policies: [],
  highlights: [],
  external_links: [],
  schema_version: 1,
};

describe('HotelDetailPage', () => {
  it('renders hero, breadcrumb, key facts, rooms, amenities, FAQ, and reviews placeholder', async () => {
    vi.mocked(apiClient.getHotelBySlug).mockResolvedValue(baseHotel);

    render(<HotelDetailPage />);

    // Hero h1
    expect(await screen.findByRole('heading', { level: 1, name: 'Aman Tokyo' })).toBeTruthy();

    // Breadcrumb shows Home + Dream Hotels + hotel name
    expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeTruthy();
    expect(screen.getAllByText('Home').length).toBeGreaterThan(0);

    // Key fact tiles render only fields with data (3 here)
    expect(screen.getByText('15:00')).toBeTruthy();
    expect(screen.getByText('12:00')).toBeTruthy();
    expect(screen.getByText('5')).toBeTruthy();

    // Rooms grid
    expect(screen.getByText('Deluxe Room')).toBeTruthy();
    expect(screen.getByText('Aman Suite')).toBeTruthy();

    // Amenity grid
    expect(screen.getByText('Spa')).toBeTruthy();
    expect(screen.getByText('Pool')).toBeTruthy();

    // Reviews section (shared EntityReviews — empty state for a hotel with no reviews)
    expect(await screen.findByText('No reviews yet')).toBeTruthy();

    // FAQ
    expect(screen.getByText('Check-in time?')).toBeTruthy();

    // Submit Request CTAs (sticky bar + booking card) + Ask Concierge
    expect(screen.getAllByRole('button', { name: /submit request/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /ask concierge/i })).toBeTruthy();
  });

  it('hides rooms / amenities / FAQ sections when their data is empty', async () => {
    vi.mocked(apiClient.getHotelBySlug).mockResolvedValue({
      ...baseHotel,
      rooms: [],
      features: [],
      faqs: [],
    });

    render(<HotelDetailPage />);

    await waitFor(() => {
      expect(screen.queryByText('Deluxe Room')).toBeNull();
    });
    expect(screen.queryByText('Spa')).toBeNull();
    expect(screen.queryByText('Check-in time?')).toBeNull();
    // Reviews section still renders (its own data/empty state)
    expect(await screen.findByText('No reviews yet')).toBeTruthy();
  });

  it('hides the overview section entirely when no overview text and no key facts exist', async () => {
    vi.mocked(apiClient.getHotelBySlug).mockResolvedValue({
      ...baseHotel,
      overview: null,
      check_in_time: null,
      check_out_time: null,
      star_rating: null,
    });

    render(<HotelDetailPage />);

    // Wait for load to complete
    expect(await screen.findByRole('heading', { level: 1, name: 'Aman Tokyo' })).toBeTruthy();
    // Overview heading should not be present
    expect(screen.queryByText(/About the Hotel/i)).toBeNull();
  });

  it('shows no benefits box for a hotel with no benefits', async () => {
    vi.mocked(apiClient.getHotelBySlug).mockResolvedValue({ ...baseHotel, benefits: [] });

    render(<HotelDetailPage />);

    expect(await screen.findByRole('heading', { level: 1, name: 'Aman Tokyo' })).toBeTruthy();
    // The benefits box title must not render — no hardcoded fallback bullets.
    expect(screen.queryByText(enTranslations['hotel.booking_benefits_title'])).toBeNull();
  });

  it('shows exactly the real benefits when the hotel has them', async () => {
    vi.mocked(apiClient.getHotelBySlug).mockResolvedValue({
      ...baseHotel,
      benefits: [
        {
          program_name: 'TiP Program',
          valid_from: null,
          valid_until: null,
          benefits: [
            { en: 'Daily breakfast for two guests', kr: '2인 매일 조식' },
            { en: 'USD 100 hotel credit', kr: '100달러 호텔 크레딧' },
          ],
        },
      ],
    });

    render(<HotelDetailPage />);

    // Both real benefits render as bullets in the box (the box title's
    // decorative ✦ prefix shares a node, so the bullets are the stable signal).
    expect(await screen.findByText('Daily breakfast for two guests')).toBeTruthy();
    expect(screen.getByText('USD 100 hotel credit')).toBeTruthy();
  });

  it('hides the benefits box when selected dates exclude all benefit programs', async () => {
    vi.mocked(apiClient.getHotelBySlug).mockResolvedValue({
      ...baseHotel,
      benefits: [
        {
          program_name: 'Winter Program',
          valid_from: '2020-01-01',
          valid_until: '2020-12-31',
          benefits: [{ en: 'Daily breakfast for two guests', kr: '2인 매일 조식' }],
        },
      ],
    });

    render(<HotelDetailPage />);

    // Wait for the hotel to load — with no dates picked the box shows the
    // program benefit (with an eligibility label appended).
    expect(await screen.findByText(/Daily breakfast for two guests/)).toBeTruthy();

    // Pick check-in / check-out dates outside the program's validity window.
    const checkIn = document.getElementById('hotel-booking-checkin') as HTMLInputElement;
    const checkOut = document.getElementById('hotel-booking-checkout') as HTMLInputElement;
    fireEvent.change(checkIn, { target: { value: '2030-06-01' } });
    fireEvent.change(checkOut, { target: { value: '2030-06-05' } });

    // No benefits valid for these dates → the box (and its bullets) disappear,
    // and the hardcoded fallback is NOT resurrected.
    await waitFor(() => {
      expect(screen.queryByText(/Daily breakfast for two guests/)).toBeNull();
    });
  });

  it('renders not-found state when API rejects', async () => {
    vi.mocked(apiClient.getHotelBySlug).mockRejectedValue(new Error('boom'));

    render(<HotelDetailPage />);

    expect(await screen.findByText('Hotel Not Found')).toBeTruthy();
    expect(screen.getByRole('link', { name: /back to hotels/i }).getAttribute('href')).toBe(
      '/dream-hotels',
    );
  });
});
