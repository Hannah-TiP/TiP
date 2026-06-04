/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-unused-vars */
import type { AnchorHTMLAttributes, ImgHTMLAttributes } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DreamHotelsPage from '@/app/dream-hotels/page';
import { apiClient } from '@/lib/api-client';
import en from '@/translations/en.json';
import type { Hotel } from '@/types/hotel';
import type { PaginatedResult } from '@/types/common';

function page(items: Hotel[], extra?: Partial<PaginatedResult<Hotel>>): PaginatedResult<Hotel> {
  return { items, hasMore: false, total: items.length, page: 1, ...extra };
}

// jsdom has no IntersectionObserver; the infinite-scroll sentinel needs it.
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
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
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
vi.mock('@/components/DraftBadge', () => ({ default: () => null }));
vi.mock('@/components/WishlistButton', () => ({ default: () => <button>wishlist</button> }));
vi.mock('@/components/reviews/EntityRatingBadge', () => ({ default: () => null }));
vi.mock('@/components/HotelMap', () => ({
  default: ({ hotels }: { hotels: Hotel[] }) => (
    <div data-testid="hotel-map-stub">map:{hotels.length}</div>
  ),
}));

vi.mock('@/hooks/usePreviewMode', () => ({
  usePreviewMode: () => ({ isPreview: false, isAllowed: false, toggle: () => {} }),
}));

// Identity debounce so search input changes apply synchronously in tests.
vi.mock('@/hooks/useDebounce', () => ({ useDebounce: (v: string) => v }));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    lang: 'en' as const,
    setLang: vi.fn(),
    t: (key: string) => (en as Record<string, string>)[key] ?? key,
  }),
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    getHotels: vi.fn(),
    getReviewAggregates: vi.fn().mockResolvedValue({}),
    searchDestinations: vi.fn().mockResolvedValue([]),
  },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function hotel(id: number): Hotel {
  return {
    id,
    slug: `hotel-${id}`,
    status: 'published',
    star_rating: '5',
    name: { en: `Hotel ${id}`, kr: '' },
    address: { en: 'Somewhere', kr: '' },
    images: [{ original: `https://example.com/${id}.jpg` }],
    schema_version: 1,
  };
}

describe('DreamHotelsPage — pagination + map gating', () => {
  it('map-hidden mode: fetches page 1 with per_page=24 and shows the no-more footer', async () => {
    vi.mocked(apiClient.getHotels).mockResolvedValue(page([hotel(1), hotel(2)]));

    render(<DreamHotelsPage />);

    await waitFor(() =>
      expect(vi.mocked(apiClient.getHotels).mock.calls.length).toBeGreaterThan(0),
    );

    const firstCall = vi.mocked(apiClient.getHotels).mock.calls[0][0];
    expect(firstCall?.per_page).toBe(24);
    expect(firstCall?.page).toBe(1);

    // No search / destination signal → map is not mounted.
    expect(screen.queryByTestId('hotel-map')).toBeNull();
    // hasMore=false → "No more results" footer present.
    expect(await screen.findByTestId('no-more-results')).toBeTruthy();
  });

  it('map-hidden mode hides the cap banner regardless of total', async () => {
    vi.mocked(apiClient.getHotels).mockResolvedValue(
      page([hotel(1)], { total: 9000, hasMore: true }),
    );

    render(<DreamHotelsPage />);

    await screen.findByText('Hotel 1');
    expect(screen.queryByTestId('map-cap-banner')).toBeNull();
  });

  it('map-visible mode (search active): single per_page=500 fetch, shows map + cap banner over 500', async () => {
    // Initial (empty-search) fetch + the post-search fetch both resolve the
    // same large page so the cap banner shows once the map is visible.
    vi.mocked(apiClient.getHotels).mockResolvedValue(
      page([hotel(1)], { total: 742, hasMore: false }),
    );

    render(<DreamHotelsPage />);
    await waitFor(() =>
      expect(vi.mocked(apiClient.getHotels).mock.calls.length).toBeGreaterThan(0),
    );

    // Type a hotel-name search → map-visible mode.
    const searchInput = screen.getByPlaceholderText('Search hotels by name...');
    fireEvent.change(searchInput, { target: { value: 'Ritz' } });

    await waitFor(() => {
      const calls = vi.mocked(apiClient.getHotels).mock.calls;
      expect(calls.some((c) => c[0]?.q === 'Ritz' && c[0]?.per_page === 500)).toBe(true);
    });

    // Map mounts and the cap banner appears (742 > 500).
    expect(await screen.findByTestId('hotel-map')).toBeTruthy();
    expect(await screen.findByTestId('map-cap-banner')).toBeTruthy();
    // No infinite-scroll footer in map-visible mode.
    expect(screen.queryByTestId('no-more-results')).toBeNull();
  });
});
