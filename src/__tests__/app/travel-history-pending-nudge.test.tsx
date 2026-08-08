import type { AnchorHTMLAttributes } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TravelHistoryTripDetailPage from '@/app/my-page/travel-history/[id]/page';
import { apiClient } from '@/lib/api-client';
import { getTripWithVersion, type TripWithVersion } from '@/lib/trip-utils';
import en from '@/translations/en.json';
import type { ProjectedTripEarn, StayCredit } from '@/types/stay-credit';

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

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: '42' }),
}));

vi.mock('@/components/Footer', () => ({
  default: () => <div>Footer</div>,
}));

vi.mock('@/components/BookingDocuments', () => ({
  default: () => <div>BookingDocuments</div>,
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    lang: 'en' as const,
    setLang: vi.fn(),
    t: (key: string) => (en as Record<string, string>)[key] ?? key,
  }),
}));

vi.mock('@/lib/trip-utils', () => ({
  collectTripDocuments: () => [],
  getTripReviewableItems: () => [],
  getTripWithVersion: vi.fn(),
  toReviewableEntities: () => [],
  tripDayNumber: () => 1,
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    getMyCredits: vi.fn(),
    getMyCreditProjection: vi.fn(),
    getProfile: vi.fn(),
    getReviewsByEntity: vi.fn(),
  },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const BUNDLE = {
  trip: { id: 42, user_id: 7, status: 'travel-completed', schema_version: 1 },
  currentVersion: {
    id: 420,
    trip_id: 42,
    adults: 2,
    kids: 0,
    title: 'Kyoto Escape',
    start_date: '2026-07-01',
    end_date: '2026-07-05',
    plan: [],
    schema_version: 1,
  },
} as unknown as TripWithVersion;

const EARNED_CREDIT: StayCredit = {
  id: 9,
  user_id: 7,
  source: 'payment_points',
  status: 'issued',
  amount_cents: 500,
  currency: 'USD',
  source_ref: 'trip:42:tiered_earn',
};

const PENDING: ProjectedTripEarn = {
  trip_id: 42,
  trip_title: 'Kyoto Escape',
  eligible_spend_cents: 100000,
  currency: 'USD',
  tier_rate: 0.005,
  projected_amount_cents: 500,
  blocking_reason: 'awaiting_review',
};

function mockApi(credits: StayCredit[], projections: ProjectedTripEarn[]) {
  vi.mocked(getTripWithVersion).mockResolvedValue(BUNDLE);
  vi.mocked(apiClient.getMyCredits).mockResolvedValue(credits);
  vi.mocked(apiClient.getMyCreditProjection).mockResolvedValue({
    user_id: 7,
    has_paid_trips: true,
    projections,
  });
}

describe('Pending-credit nudge on /my-page/travel-history/[id]', () => {
  it('shows the nudge with the ~amount and a reviews link when nothing was earned yet', async () => {
    mockApi([], [PENDING]);

    render(<TravelHistoryTripDetailPage />);

    const nudge = await screen.findByTestId('pending-credit-nudge');
    expect(nudge.textContent).toContain('Credit you can still earn');
    expect(nudge.textContent).toContain('~USD 5.00');
    expect(nudge.textContent).toContain('current membership tier');
    const cta = screen.getByRole('link', { name: 'Write a review →' });
    expect(cta.getAttribute('href')).toBe('/my-page/travel-history/42/reviews');
    // The earned-credits card is absent — the nudge is its empty-state sibling.
    expect(screen.queryByText(en['trip_detail.credits_earned'])).toBeNull();
  });

  it('shows the earned-credits card instead once the trip has earned', async () => {
    mockApi([EARNED_CREDIT], []);

    render(<TravelHistoryTripDetailPage />);

    expect(await screen.findByText(en['trip_detail.credits_earned'])).toBeTruthy();
    expect(screen.queryByTestId('pending-credit-nudge')).toBeNull();
  });

  it('hides the nudge when the pending projection belongs to a different trip', async () => {
    mockApi([], [{ ...PENDING, trip_id: 66 }]);

    render(<TravelHistoryTripDetailPage />);

    await screen.findByText(en['trip_detail.completed_trip']);
    expect(screen.queryByTestId('pending-credit-nudge')).toBeNull();
  });
});
