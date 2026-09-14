import type { AnchorHTMLAttributes } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TravelHistoryTripDetailPage from '@/app/my-page/travel-history/[id]/page';
import { apiClient } from '@/lib/api-client';
import { getTripWithVersion, type TripWithVersion } from '@/lib/trip-utils';
import en from '@/translations/en.json';
import type { PointTransaction, ProjectedTripEarn } from '@/types/stay-credit';
import type { BenefitsResponse } from '@/types/v2/benefits';

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
    getMyPoints: vi.fn(),
    getMyCreditProjection: vi.fn(),
    getProfile: vi.fn(),
    getReviewsByEntity: vi.fn(),
  },
}));

// Registry payload carrying the `point_unit` entry (100 P = 1 USD).
const POINT_UNIT_PAYLOAD: BenefitsResponse = {
  benefits: [
    {
      key: 'point_unit',
      kind: 'unit_definition',
      unit: 'points',
      values_by_tier: { carte: '100', cercle: '100', confidence: '100', cenacle: '100' },
      copy: { en: 'x', kr: 'x' },
    },
  ],
  resolved: null,
};
let benefitsValue: BenefitsResponse | null = POINT_UNIT_PAYLOAD;
vi.mock('@/hooks/useBenefits', () => ({
  useBenefits: () => benefitsValue,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  benefitsValue = POINT_UNIT_PAYLOAD;
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

const EARNED_CREDIT: PointTransaction = {
  id: 9,
  user_id: 7,
  source: 'payment_points',
  status: 'issued',
  delta_points: 500,
  kind: 'grant',
  amount_cents: 500,
  currency: 'USD',
  source_ref: 'trip:42:tiered_earn',
};

// A wallet-level spend that happens to reference the same trip — NOT
// earned from it, so the per-trip section must ignore it.
const SPEND_ROW: PointTransaction = {
  id: 10,
  user_id: 7,
  source: 'payment_points',
  status: 'issued',
  delta_points: -200,
  kind: 'use',
  consumes_transaction_id: 9,
  source_ref: 'trip:42:tiered_earn',
};

const PENDING: ProjectedTripEarn = {
  trip_id: 42,
  trip_title: 'Kyoto Escape',
  eligible_spend_cents: 100000,
  currency: 'USD',
  tier_rate: 0.005,
  projected_amount_cents: 1250,
  projected_points: 1250,
  blocking_reason: 'awaiting_completion',
};

function mockApi(credits: PointTransaction[], projections: ProjectedTripEarn[]) {
  vi.mocked(getTripWithVersion).mockResolvedValue(BUNDLE);
  vi.mocked(apiClient.getMyPoints).mockResolvedValue({
    user_id: 7,
    balance_points: credits.reduce((acc, c) => acc + (c.delta_points ?? 0), 0),
    transactions: credits,
  });
  vi.mocked(apiClient.getMyCreditProjection).mockResolvedValue({
    user_id: 7,
    has_paid_trips: true,
    projections,
  });
}

describe('Pending-credit nudge on /my-page/travel-history/[id]', () => {
  it('shows the nudge in P with the USD approximation and completion copy when nothing was earned yet', async () => {
    mockApi([], [PENDING]);

    render(<TravelHistoryTripDetailPage />);

    const nudge = await screen.findByTestId('pending-credit-nudge');
    expect(nudge.textContent).toContain('TiP Points you can still earn');
    expect(nudge.textContent).not.toContain('Credit you can still earn');
    expect(screen.getByTestId('pending-points').textContent).toBe('+1,250 P');
    expect(screen.getByTestId('pending-usd-approx').textContent).toBe('≈ USD 12');
    expect(nudge.textContent).not.toContain('USD 12.50');
    // Completion-based body — no "review to earn", still tier-disclaimed.
    expect(nudge.textContent).toContain(
      'An estimated 1,250 P is on its way — added automatically now that your trip has ended',
    );
    expect(nudge.textContent).not.toContain('Review this trip to earn');
    expect(nudge.textContent).toContain('current membership tier');
    // Reviews are a SEPARATE reward, no amount stated.
    expect(nudge.textContent).toContain(en['credits.pending_review_separate']);
    const cta = screen.getByRole('link', { name: 'Write a review →' });
    expect(cta.getAttribute('href')).toBe('/my-page/travel-history/42/reviews');
    // The earned-credits card is absent — the nudge is its empty-state sibling.
    expect(screen.queryByText(en['trip_detail.credits_earned'])).toBeNull();
  });

  it('maps the legacy awaiting_review wire value to the completion copy', async () => {
    mockApi([], [{ ...PENDING, blocking_reason: 'awaiting_review' }]);

    render(<TravelHistoryTripDetailPage />);

    const nudge = await screen.findByTestId('pending-credit-nudge');
    expect(nudge.textContent).toContain('1,250 P is on its way');
    expect(nudge.textContent).not.toContain('Review this trip');
  });

  it('falls back to cents → points for a USD projection from an older backend', async () => {
    mockApi([], [{ ...PENDING, projected_points: undefined }]);

    render(<TravelHistoryTripDetailPage />);

    await screen.findByTestId('pending-credit-nudge');
    expect(screen.getByTestId('pending-points').textContent).toBe('+1,250 P');
  });

  it('renders figure-free for a non-USD legacy projection (no invented FX)', async () => {
    mockApi([], [{ ...PENDING, projected_points: undefined, currency: 'EUR' }]);

    render(<TravelHistoryTripDetailPage />);

    const nudge = await screen.findByTestId('pending-credit-nudge');
    expect(screen.queryByTestId('pending-points')).toBeNull();
    expect(nudge.textContent).toContain(en['trip_detail.pending_points_body_no_figure']);
    expect(nudge.textContent).not.toContain('EUR');
  });

  it('shows the after-trip copy WITHOUT a reviews link for a not-finished trip', async () => {
    // Accrual only fires once the trip is date-finished, so the nudge must
    // not steer the member to the reviews page early.
    mockApi([], [{ ...PENDING, blocking_reason: 'trip_not_finished' }]);

    render(<TravelHistoryTripDetailPage />);

    const nudge = await screen.findByTestId('pending-credit-nudge');
    expect(screen.getByTestId('pending-points').textContent).toBe('+1,250 P');
    expect(nudge.textContent).toContain(
      "You'll earn an estimated 1,250 P automatically after this trip ends",
    );
    // No reviews CTA in this state.
    expect(screen.queryByRole('link', { name: 'Write a review →' })).toBeNull();
    expect(nudge.querySelector('a')).toBeNull();
  });

  it('shows the earned-credits card instead once the trip has earned', async () => {
    mockApi([EARNED_CREDIT], []);

    render(<TravelHistoryTripDetailPage />);

    expect(await screen.findByText(en['trip_detail.credits_earned'])).toBeTruthy();
    expect(screen.queryByTestId('pending-credit-nudge')).toBeNull();
  });

  it('renders the earned points in P (no currency) and ignores spend rows for the trip', async () => {
    mockApi([SPEND_ROW, EARNED_CREDIT], []);

    render(<TravelHistoryTripDetailPage />);

    const heading = await screen.findByText(en['trip_detail.credits_earned']);
    const card = heading.parentElement as HTMLElement;
    expect(card.textContent).toContain('+500 P');
    // Total = the grant lots only; the −200 P use row is a wallet-level
    // event, not something this trip earned.
    expect(card.textContent).toContain('500 P');
    expect(card.textContent).not.toContain('300 P');
    expect(card.textContent).not.toContain('\u2212200 P');
    expect(card.textContent).not.toContain('USD');
  });

  it('shows the nudge when the trip only has a spend row (nothing earned yet)', async () => {
    mockApi([SPEND_ROW], [PENDING]);

    render(<TravelHistoryTripDetailPage />);

    expect(await screen.findByTestId('pending-credit-nudge')).toBeTruthy();
    expect(screen.queryByText(en['trip_detail.credits_earned'])).toBeNull();
  });

  it('hides the nudge when the pending projection belongs to a different trip', async () => {
    mockApi([], [{ ...PENDING, trip_id: 66 }]);

    render(<TravelHistoryTripDetailPage />);

    await screen.findByText(en['trip_detail.completed_trip']);
    expect(screen.queryByTestId('pending-credit-nudge')).toBeNull();
  });
});
