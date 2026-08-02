/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-unused-vars */
import type { AnchorHTMLAttributes, ImgHTMLAttributes } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MoreDreamsPage from '@/app/more-dreams/page';
import { apiClient } from '@/lib/api-client';
import en from '@/translations/en.json';
import type { Activity } from '@/types/activity';
import type { Restaurant } from '@/types/restaurant';
import type { City } from '@/types/location';
import type { PaginatedResult } from '@/types/common';

function page<T>(items: T[]): PaginatedResult<T> {
  return { items, hasMore: false, total: items.length, page: 1 };
}

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
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    lang: 'en' as const,
    setLang: vi.fn(),
    t: (key: string) => (en as Record<string, string>)[key] ?? key,
  }),
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

vi.mock('@/components/Footer', () => ({
  default: () => <div>Footer</div>,
}));

vi.mock('@/components/PreviewBanner', () => ({
  default: () => null,
}));

vi.mock('@/hooks/usePreviewMode', () => ({
  usePreviewMode: () => ({ isPreview: false, isAllowed: false, toggle: () => {} }),
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    getActivities: vi.fn(),
    getRestaurants: vi.fn(),
    getExperienceDestinations: vi.fn(),
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

const localExperience: Activity = {
  id: 1,
  slug: 'paris-private-boat',
  city_id: 10,
  category: 'sightseeing',
  kind: 'local_experience',
  status: 'published',
  name: { en: 'Paris Private Boat Tour', kr: '파리 프라이빗 보트 투어' },
  images: [{ original: 'https://example.com/boat.jpg' }],
  schema_version: 1,
};

const signatureJourney: Activity = {
  id: 4,
  slug: 'ritz-carlton-yacht',
  city_id: 10,
  category: 'culture',
  kind: 'package',
  status: 'published',
  name: { en: 'The Ritz-Carlton Yacht', kr: '리츠칼튼 요트' },
  images: [{ original: 'https://example.com/yacht.jpg' }],
  schema_version: 1,
};

const restaurant: Restaurant = {
  id: 1,
  slug: 'noma',
  city_id: 10,
  status: 'published',
  name: { en: 'Noma', kr: '노마' },
  images: [{ original: 'https://example.com/noma.jpg' }],
  schema_version: 1,
};

const paris: City = {
  id: 10,
  name: { en: 'Paris', kr: '파리' },
  slug: 'paris',
  region_id: 1,
  status: true,
  link_services: true,
  schema_version: 1,
};

describe('MoreDreamsPage — Activities + Restaurants only (no Signature Journeys)', () => {
  it('renders the Activities & Experiences + Curated Restaurants titles', async () => {
    vi.mocked(apiClient.getActivities).mockResolvedValue(page([localExperience]));
    vi.mocked(apiClient.getRestaurants).mockResolvedValue(page([restaurant]));
    vi.mocked(apiClient.getExperienceDestinations).mockResolvedValue([paris]);

    render(<MoreDreamsPage />);

    expect(
      await screen.findByRole('heading', { level: 2, name: /Activities & Experiences/i }),
    ).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: /Curated Restaurants/i })).toBeTruthy();
  });

  it('never renders a Signature Journeys section on More Dreams', async () => {
    vi.mocked(apiClient.getActivities).mockResolvedValue(page([localExperience]));
    vi.mocked(apiClient.getRestaurants).mockResolvedValue(page([restaurant]));
    vi.mocked(apiClient.getExperienceDestinations).mockResolvedValue([paris]);

    const { container } = render(<MoreDreamsPage />);

    await screen.findByRole('heading', { level: 2, name: /Activities & Experiences/i });

    expect(screen.queryByRole('heading', { level: 2, name: /^Signature Journeys$/i })).toBeNull();
    expect(container.querySelector('[data-testid="section-signature-journeys"]')).toBeNull();
  });

  it('calls getActivities exactly once with kind=local_experience (no package fetch)', async () => {
    vi.mocked(apiClient.getActivities).mockResolvedValue(page([localExperience]));
    vi.mocked(apiClient.getRestaurants).mockResolvedValue(page([]));
    vi.mocked(apiClient.getExperienceDestinations).mockResolvedValue([paris]);

    render(<MoreDreamsPage />);

    await waitFor(() => {
      expect(vi.mocked(apiClient.getActivities).mock.calls.length).toBe(1);
    });

    const calls = vi.mocked(apiClient.getActivities).mock.calls;
    expect(calls[0]?.[0]?.kind).toBe('local_experience');
    // No call ever requests kind=package from More Dreams.
    expect(calls.some((c) => c[0]?.kind === 'package')).toBe(false);
  });

  it('renders the standard (neutral) pill — never the gold signature pill', async () => {
    vi.mocked(apiClient.getActivities).mockResolvedValue(page([localExperience]));
    vi.mocked(apiClient.getRestaurants).mockResolvedValue(page([]));
    vi.mocked(apiClient.getExperienceDestinations).mockResolvedValue([paris]);

    render(<MoreDreamsPage />);

    await screen.findByRole('heading', { level: 2, name: /Activities & Experiences/i });

    const standardPill = screen.getByTestId('activity-pill-standard');
    expect(standardPill.className).toContain('bg-white/90');
    expect(standardPill.className).not.toContain('bg-gold');
  });

  it('defensively drops any package items that leak into the local_experience bucket', async () => {
    // Backend is the source of truth, but assert the page never surfaces a
    // package on More Dreams even if one leaks into the local_experience call.
    vi.mocked(apiClient.getActivities).mockResolvedValue(page([localExperience, signatureJourney]));
    vi.mocked(apiClient.getRestaurants).mockResolvedValue(page([]));
    vi.mocked(apiClient.getExperienceDestinations).mockResolvedValue([paris]);

    render(<MoreDreamsPage />);

    await screen.findByRole('heading', { level: 2, name: /Activities & Experiences/i });

    expect(screen.getByText('Paris Private Boat Tour')).toBeTruthy();
    expect(screen.queryByText('The Ritz-Carlton Yacht')).toBeNull();
  });

  it('treats activities with missing kind as local_experience (defensive)', async () => {
    const noKindActivity: Activity = {
      ...localExperience,
      id: 99,
      slug: 'no-kind',
      kind: null,
      name: { en: 'No Kind Activity', kr: '' },
    };
    vi.mocked(apiClient.getActivities).mockResolvedValue(page([noKindActivity]));
    vi.mocked(apiClient.getRestaurants).mockResolvedValue(page([]));
    vi.mocked(apiClient.getExperienceDestinations).mockResolvedValue([paris]);

    render(<MoreDreamsPage />);

    expect(
      await screen.findByRole('heading', { level: 2, name: /Activities & Experiences/i }),
    ).toBeTruthy();
    expect(screen.getByText('No Kind Activity')).toBeTruthy();
  });
});

/**
 * SMA-247: the destination dropdown is fed by the published-content-derived
 * experiences endpoint, never by the global city catalog (whose first-100-row
 * cap used to hide destinations entirely).
 */
describe('MoreDreamsPage — destination options (SMA-247)', () => {
  /** A city that would never appear in the first 100 rows of the catalog. */
  const ushuaia: City = {
    ...paris,
    id: 84231,
    name: { en: 'Ushuaia', kr: '우수아이아' },
    slug: 'ushuaia',
  };

  it('reads destinations from getExperienceDestinations, not the city catalog', async () => {
    vi.mocked(apiClient.getActivities).mockResolvedValue(page([localExperience]));
    vi.mocked(apiClient.getRestaurants).mockResolvedValue(page([]));
    vi.mocked(apiClient.getExperienceDestinations).mockResolvedValue([ushuaia]);

    render(<MoreDreamsPage />);

    await waitFor(() => {
      expect(vi.mocked(apiClient.getExperienceDestinations).mock.calls.length).toBe(1);
    });
    expect(vi.mocked(apiClient.getExperienceDestinations).mock.calls[0][0]).toBe('en');
    // The catalog method must not exist on the page's API surface any more.
    expect('getCities' in apiClient).toBe(false);
  });

  it('offers a far-catalog city in the destination dropdown', async () => {
    vi.mocked(apiClient.getActivities).mockResolvedValue(page([localExperience]));
    vi.mocked(apiClient.getRestaurants).mockResolvedValue(page([]));
    vi.mocked(apiClient.getExperienceDestinations).mockResolvedValue([ushuaia]);

    render(<MoreDreamsPage />);

    await screen.findByRole('heading', { level: 2, name: /Activities & Experiences/i });

    fireEvent.click(screen.getByRole('button', { name: /All Destinations/i }));

    expect(await screen.findByRole('button', { name: 'Ushuaia' })).toBeTruthy();
  });
});
