import type { AnchorHTMLAttributes } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TravelHistory from '@/app/my-page/travel-history/page';
import { apiClient } from '@/lib/api-client';
import { getTripsWithVersions, type TripWithVersion } from '@/lib/trip-utils';
import en from '@/translations/en.json';
import type { TripStatus } from '@/types/trip';

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

// Stable `t` — the page's load effect depends on it, so a per-render closure
// would re-run the effect and inflate the API call counts asserted below.
vi.mock('@/contexts/LanguageContext', () => {
  const t = (key: string) => (en as Record<string, string>)[key] ?? key;
  return { useLanguage: () => ({ lang: 'en' as const, setLang: vi.fn(), t }) };
});

// Every trip has one reviewable hotel so review-status lookups WOULD fire.
vi.mock('@/lib/trip-utils', () => ({
  getTripReviewableItems: () => [{ item_type: 'hotel', hotel_id: 7, title: 'Aman Kyoto' }],
  getTripsWithVersions: vi.fn(),
  toReviewableEntities: () => [{ entityType: 'hotel', entityId: 7, title: 'Aman Kyoto' }],
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    getProfile: vi.fn(),
    getReviewsByEntity: vi.fn(),
  },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function bundle(id: number, status: TripStatus, title: string): TripWithVersion {
  return {
    trip: { id, user_id: 1, status, schema_version: 1 },
    currentVersion: {
      id: id * 10,
      trip_id: id,
      adults: 2,
      kids: 0,
      title,
      start_date: '2026-07-01',
      end_date: '2026-07-05',
      schema_version: 1,
    },
    activeQuote: null,
  };
}

describe('Travel History list — no-show trips (SMA-362)', () => {
  it('lists a no-show trip with a neutral No-show badge and no review-status badge', async () => {
    vi.mocked(getTripsWithVersions).mockResolvedValue([
      bundle(1, 'travel-completed', 'Completed Trip'),
      bundle(2, 'no-show', 'No-show Trip'),
      bundle(3, 'in-progress', 'Active Trip'),
    ]);
    vi.mocked(apiClient.getProfile).mockResolvedValue({ id: 1 } as never);
    vi.mocked(apiClient.getReviewsByEntity).mockResolvedValue({
      reviews: [],
      aggregate: { average_rating: 0, review_count: 0 },
    } as never);

    render(<TravelHistory />);

    expect((await screen.findAllByText('No-show Trip')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Completed Trip').length).toBeGreaterThan(0);
    // Active trips stay on the upcoming dashboard.
    expect(screen.queryByText('Active Trip')).toBeNull();

    const badges = screen.getAllByTestId('travel-history-status-badge');
    expect(badges.map((b) => b.textContent)).toEqual([en['travel_history.completed'], 'No-show']);
    // Completed keeps the green style; no-show is neutral gray.
    expect(badges[0].className).toContain('bg-green-100');
    expect(badges[1].className).toContain('bg-gray-200');
    expect(badges[1].className).not.toContain('bg-green-100');

    // Review-status lookups fire only for the completed trip (one hotel each).
    await screen.findByText('0/1 reviewed');
    expect(vi.mocked(apiClient.getReviewsByEntity)).toHaveBeenCalledTimes(1);
    expect(screen.getAllByText('0/1 reviewed')).toHaveLength(1);
  });
});
