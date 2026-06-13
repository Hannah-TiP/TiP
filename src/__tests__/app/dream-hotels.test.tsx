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

// Mutable so individual tests can flip the active language before render.
const languageState = vi.hoisted(() => ({ lang: 'en' as 'en' | 'kr' }));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    lang: languageState.lang,
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
  languageState.lang = 'en';
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
  it('map-hidden mode: fetches page 1 with per_page=50 and shows the no-more footer', async () => {
    vi.mocked(apiClient.getHotels).mockResolvedValue(page([hotel(1), hotel(2)]));

    render(<DreamHotelsPage />);

    await waitFor(() =>
      expect(vi.mocked(apiClient.getHotels).mock.calls.length).toBeGreaterThan(0),
    );

    const firstCall = vi.mocked(apiClient.getHotels).mock.calls[0][0];
    expect(firstCall?.per_page).toBe(50);
    expect(firstCall?.page).toBe(1);

    // No search / destination signal → map is not mounted.
    expect(screen.queryByTestId('hotel-map')).toBeNull();
    // hasMore=false → "No more results" footer present (always rendered).
    expect(await screen.findByTestId('no-more-results')).toBeTruthy();
  });

  it('never requests a per_page above the backend cap of 50', async () => {
    vi.mocked(apiClient.getHotels).mockResolvedValue(
      page([hotel(1)], { total: 9000, hasMore: true }),
    );

    render(<DreamHotelsPage />);
    await screen.findByText('Hotel 1');

    // Type a hotel-name search → map becomes visible; pagination is unchanged.
    const searchInput = screen.getByPlaceholderText('Search hotels by name...');
    fireEvent.change(searchInput, { target: { value: 'Ritz' } });

    await waitFor(() =>
      expect(vi.mocked(apiClient.getHotels).mock.calls.some((c) => c[0]?.q === 'Ritz')).toBe(true),
    );

    for (const [args] of vi.mocked(apiClient.getHotels).mock.calls) {
      expect(args?.per_page).toBeLessThanOrEqual(50);
    }
    // The removed map-cap banner must never render.
    expect(screen.queryByTestId('map-cap-banner')).toBeNull();
  });

  it('map-visible mode (search active): normal pagination, map renders loaded hotels, infinite scroll stays active', async () => {
    vi.mocked(apiClient.getHotels).mockResolvedValue(
      page([hotel(1), hotel(2)], { total: 2, hasMore: false }),
    );

    render(<DreamHotelsPage />);
    await waitFor(() =>
      expect(vi.mocked(apiClient.getHotels).mock.calls.length).toBeGreaterThan(0),
    );

    // Type a hotel-name search → map-visible mode (no special fetch carve-out).
    const searchInput = screen.getByPlaceholderText('Search hotels by name...');
    fireEvent.change(searchInput, { target: { value: 'Ritz' } });

    await waitFor(() => {
      const calls = vi.mocked(apiClient.getHotels).mock.calls;
      expect(
        calls.some((c) => c[0]?.q === 'Ritz' && c[0]?.per_page === 50 && c[0]?.page === 1),
      ).toBe(true);
    });

    // Map mounts and renders the accumulated/loaded hotels; no cap banner.
    expect(await screen.findByTestId('hotel-map')).toBeTruthy();
    expect(screen.queryByTestId('map-cap-banner')).toBeNull();
    // Infinite-scroll affordances stay rendered while the map is visible.
    expect(await screen.findByTestId('infinite-sentinel')).toBeTruthy();
    expect(await screen.findByTestId('no-more-results')).toBeTruthy();
  });
});

describe('DreamHotelsPage — active language drives the hotels fetch (SMA-116)', () => {
  it('sends language: "kr" when the context language is KR and renders KR content', async () => {
    languageState.lang = 'kr';
    // Backend collapses MultiLanguageStrings to the requested language: with
    // language=kr the `en` fields come back null.
    const krHotel: Hotel = {
      ...hotel(1),
      name: { en: null, kr: '아만 도쿄' },
      address: { en: null, kr: '도쿄 오테마치' },
    };
    vi.mocked(apiClient.getHotels).mockResolvedValue(page([krHotel]));

    render(<DreamHotelsPage />);

    await waitFor(() =>
      expect(vi.mocked(apiClient.getHotels).mock.calls.length).toBeGreaterThan(0),
    );
    expect(vi.mocked(apiClient.getHotels).mock.calls[0][0]?.language).toBe('kr');

    // getLocalizedText falls back to kr when en is null — KR name renders.
    expect(await screen.findByText('아만 도쿄')).toBeTruthy();
  });

  it('sends language: "en" when the context language is EN', async () => {
    vi.mocked(apiClient.getHotels).mockResolvedValue(page([hotel(1)]));

    render(<DreamHotelsPage />);

    await waitFor(() =>
      expect(vi.mocked(apiClient.getHotels).mock.calls.length).toBeGreaterThan(0),
    );
    expect(vi.mocked(apiClient.getHotels).mock.calls[0][0]?.language).toBe('en');
  });
});
