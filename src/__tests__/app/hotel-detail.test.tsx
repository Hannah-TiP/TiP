/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-unused-vars */
import type { AnchorHTMLAttributes, ImgHTMLAttributes } from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
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

vi.mock('@/components/TopBar', () => ({
  default: () => <div>TopBar</div>,
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

    // Reviews placeholder
    expect(screen.getByText('Reviews coming soon')).toBeTruthy();

    // FAQ
    expect(screen.getByText('Check-in time?')).toBeTruthy();

    // Reserve CTAs (sticky bar + booking card)
    expect(screen.getAllByRole('button', { name: /reserve/i }).length).toBeGreaterThan(0);
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
    // Reviews placeholder still shows (always render section heading)
    expect(screen.getByText('Reviews coming soon')).toBeTruthy();
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

  it('renders not-found state when API rejects', async () => {
    vi.mocked(apiClient.getHotelBySlug).mockRejectedValue(new Error('boom'));

    render(<HotelDetailPage />);

    expect(await screen.findByText('Hotel Not Found')).toBeTruthy();
    expect(screen.getByRole('link', { name: /back to hotels/i }).getAttribute('href')).toBe(
      '/dream-hotels',
    );
  });
});
