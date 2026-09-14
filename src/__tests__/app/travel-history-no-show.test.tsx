import type { AnchorHTMLAttributes } from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TravelHistoryTripDetailPage from '@/app/my-page/travel-history/[id]/page';
import ReviewsPage from '@/app/my-page/travel-history/[id]/reviews/page';
import { apiClient } from '@/lib/api-client';
import { getTripWithVersion, type TripWithVersion } from '@/lib/trip-utils';
import en from '@/translations/en.json';
import kr from '@/translations/kr.json';
import type { ProjectedTripEarn } from '@/types/stay-credit';
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

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: '42' }),
}));

vi.mock('@/components/Footer', () => ({
  default: () => <div>Footer</div>,
}));

vi.mock('@/components/BookingDocuments', () => ({
  default: () => <div>BookingDocuments</div>,
}));

vi.mock('@/hooks/useBenefits', () => ({
  useBenefits: () => null,
}));

vi.mock('@/components/reviews/ReviewSessionItem', () => ({
  default: () => <div data-testid="review-session-item">ReviewSessionItem</div>,
}));

let activeLang: 'en' | 'kr' = 'en';
// Stable `t` (reads the active catalog at call time) — the page's load effect
// depends on it, so a per-render closure would re-run the effect.
vi.mock('@/contexts/LanguageContext', () => {
  const t = (key: string) =>
    ((activeLang === 'en' ? en : kr) as Record<string, string>)[key] ??
    (en as Record<string, string>)[key] ??
    key;
  return { useLanguage: () => ({ lang: activeLang, setLang: vi.fn(), t }) };
});

// One reviewable hotel item so the review CTA WOULD render for a completed trip.
vi.mock('@/lib/trip-utils', () => ({
  collectTripDocuments: () => [],
  getTripReviewableItems: () => [{ item_type: 'hotel', hotel_id: 7, title: 'Aman Kyoto' }],
  getTripWithVersion: vi.fn(),
  toReviewableEntities: () => [{ entityType: 'hotel', entityId: 7, title: 'Aman Kyoto' }],
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

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  activeLang = 'en';
});

function bundle(status: TripStatus): TripWithVersion {
  return {
    trip: { id: 42, user_id: 7, status, schema_version: 1 },
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
    activeQuote: null,
  };
}

// A projection for this trip — the backend excludes no-show trips server-side,
// but the page must hide the block even if one arrives (belt and braces).
const PENDING: ProjectedTripEarn = {
  trip_id: 42,
  trip_title: 'Kyoto Escape',
  eligible_spend_cents: 100000,
  currency: 'USD',
  tier_rate: 0.005,
  projected_amount_cents: 500,
  blocking_reason: 'trip_not_finished',
};

function mockApi(status: TripStatus) {
  vi.mocked(getTripWithVersion).mockResolvedValue(bundle(status));
  vi.mocked(apiClient.getMyPoints).mockResolvedValue({
    user_id: 7,
    balance_points: 0,
    transactions: [],
  });
  vi.mocked(apiClient.getMyCreditProjection).mockResolvedValue({
    user_id: 7,
    has_paid_trips: true,
    projections: [PENDING],
  });
  vi.mocked(apiClient.getProfile).mockResolvedValue({ id: 7 } as never);
  vi.mocked(apiClient.getReviewsByEntity).mockResolvedValue({
    reviews: [],
    aggregate: { average_rating: 0, review_count: 0 },
  } as never);
}

describe('No-show trip on /my-page/travel-history/[id] (SMA-362)', () => {
  it('shows the No-show label + notice and hides the pending-earn block and review CTA', async () => {
    mockApi('no-show');

    render(<TravelHistoryTripDetailPage />);

    const notice = await screen.findByTestId('no-show-notice');
    expect(notice.textContent).toBe(en['trip_detail.no_show_notice']);
    // Hero eyebrow is the no-show label, not "Completed Trip".
    expect(screen.getByText(en['trip_detail.no_show_trip'])).toBeTruthy();
    expect(screen.queryByText(en['trip_detail.completed_trip'])).toBeNull();
    // Pending-earn block hidden even though a projection exists for the trip.
    expect(screen.queryByTestId('pending-credit-nudge')).toBeNull();
    // No "Review Your Experience" CTA / link for a no-show trip.
    expect(screen.queryByText(en['trip_detail.review_experience'])).toBeNull();
    expect(screen.queryByRole('link', { name: en['trip_detail.review_experience'] })).toBeNull();
    // And the review-status lookups were never fired.
    expect(vi.mocked(apiClient.getReviewsByEntity)).not.toHaveBeenCalled();
  });

  it('renders the Korean no-show copy in KR', async () => {
    activeLang = 'kr';
    mockApi('no-show');

    render(<TravelHistoryTripDetailPage />);

    const notice = await screen.findByTestId('no-show-notice');
    expect(notice.textContent).toBe(kr['trip_detail.no_show_notice']);
    expect(screen.getByText(kr['trip_detail.no_show_trip'])).toBeTruthy();
  });

  it('still shows the pending-earn block and review CTA for a completed trip (control)', async () => {
    mockApi('travel-completed');

    render(<TravelHistoryTripDetailPage />);

    expect(await screen.findByTestId('pending-credit-nudge')).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByRole('link', { name: en['trip_detail.review_experience'] })).toBeTruthy();
    });
    expect(screen.queryByTestId('no-show-notice')).toBeNull();
    expect(screen.getByText(en['trip_detail.completed_trip'])).toBeTruthy();
  });
});

describe('Review session route /my-page/travel-history/[id]/reviews status guard (SMA-362)', () => {
  it('renders the no-show notice instead of the form and fires no review lookups', async () => {
    mockApi('no-show');

    render(<ReviewsPage />);

    const notice = await screen.findByTestId('review-not-open-notice');
    expect(notice.textContent).toBe(en['trip_detail.no_show_notice']);
    expect(screen.queryByTestId('review-session-item')).toBeNull();
    expect(screen.queryByRole('button', { name: en['review_session.submit_reviews'] })).toBeNull();
    expect(screen.queryByText(en['review_session.title'])).toBeNull();
    const back = screen.getByRole('link', { name: en['review_session.back_to_trip'] });
    expect(back.getAttribute('href')).toBe('/my-page/travel-history/42');
    expect(vi.mocked(apiClient.getReviewsByEntity)).not.toHaveBeenCalled();
  });

  it('renders the generic not-open notice for a trip that is not completed yet', async () => {
    mockApi('paid');

    render(<ReviewsPage />);

    const notice = await screen.findByTestId('review-not-open-notice');
    expect(notice.textContent).toBe(en['review_session.not_open_notice']);
    expect(screen.queryByTestId('review-session-item')).toBeNull();
    expect(screen.queryByRole('button', { name: en['review_session.submit_reviews'] })).toBeNull();
    expect(vi.mocked(apiClient.getReviewsByEntity)).not.toHaveBeenCalled();
  });

  it('renders the Korean not-open notice in KR', async () => {
    activeLang = 'kr';
    mockApi('paid');

    render(<ReviewsPage />);

    const notice = await screen.findByTestId('review-not-open-notice');
    expect(notice.textContent).toBe(kr['review_session.not_open_notice']);
    expect(screen.getByRole('link', { name: kr['review_session.back_to_trip'] })).toBeTruthy();
  });

  it('still renders the review form for a completed trip (control)', async () => {
    mockApi('travel-completed');

    render(<ReviewsPage />);

    expect(await screen.findByTestId('review-session-item')).toBeTruthy();
    expect(screen.queryByTestId('review-not-open-notice')).toBeNull();
    expect(screen.getByRole('button', { name: en['review_session.submit_reviews'] })).toBeTruthy();
    expect(vi.mocked(apiClient.getReviewsByEntity)).toHaveBeenCalledWith('hotel', 7, 'en');
  });
});
