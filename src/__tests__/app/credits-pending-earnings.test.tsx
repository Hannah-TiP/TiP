import type { AnchorHTMLAttributes } from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MyCreditsPage from '@/app/my-page/credits/page';
import { apiClient } from '@/lib/api-client';
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
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('next-auth/react', () => ({
  useSession: () => ({ status: 'authenticated' }),
}));

vi.mock('@/components/Footer', () => ({
  default: () => <div>Footer</div>,
}));

vi.mock('@/components/credits/RedeemCodeSection', () => ({
  default: () => <div>RedeemCodeSection</div>,
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    lang: 'en' as const,
    setLang: vi.fn(),
    t: (key: string) => (en as Record<string, string>)[key] ?? key,
  }),
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    getMyPoints: vi.fn(),
    getMyCreditProjection: vi.fn(),
  },
}));

// Registry payload carrying the `point_unit` entry (100 P = 1 USD) behind
// the USD approximation and the legacy cents→points fallback. `null`
// simulates the endpoint being down.
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

const ISSUED_CREDIT: PointTransaction = {
  id: 1,
  user_id: 7,
  source: 'welcome',
  status: 'issued',
  delta_points: 10000,
  kind: 'grant',
  amount_cents: 10000,
  currency: 'USD',
  created_at: '2026-05-01T00:00:00Z',
};

function ledger(transactions: PointTransaction[]) {
  return {
    user_id: 7,
    balance_points: transactions.reduce((acc, t) => acc + (t.delta_points ?? 0), 0),
    transactions,
  };
}

function projection(overrides: Partial<ProjectedTripEarn>): ProjectedTripEarn {
  return {
    trip_id: 42,
    trip_title: 'Kyoto Escape',
    eligible_spend_cents: 100000,
    currency: 'USD',
    tier_rate: 0.005,
    projected_amount_cents: 500,
    projected_points: 500,
    blocking_reason: 'awaiting_completion',
    ...overrides,
  };
}

function mockApi(credits: PointTransaction[], projections: ProjectedTripEarn[]) {
  vi.mocked(apiClient.getMyPoints).mockResolvedValue(ledger(credits));
  vi.mocked(apiClient.getMyCreditProjection).mockResolvedValue({
    user_id: 7,
    has_paid_trips: true,
    projections,
  });
}

describe('Pending earnings on /my-page/credits', () => {
  it('lists a date-finished trip in P with the USD approximation and completion copy', async () => {
    mockApi(
      [ISSUED_CREDIT],
      [projection({ projected_points: 1250, projected_amount_cents: 1250 })],
    );

    render(<MyCreditsPage />);

    const section = await screen.findByTestId('pending-earnings');
    expect(section.textContent).toContain('Pending earnings');
    expect(section.textContent).toContain('Kyoto Escape');
    // The figure is P (wallet style) with the wallet's USD approximation —
    // no currency-denominated "~USD 12.50" anywhere.
    expect(screen.getByTestId('pending-points').textContent).toBe('+1,250 P');
    expect(screen.getByTestId('pending-usd-approx').textContent).toBe('≈ USD 12');
    expect(section.textContent).not.toContain('USD 12.50');
    expect(section.textContent).toContain('Estimated');
    // Completion-based nudge — nothing says a review is needed to earn.
    expect(section.textContent).toContain(
      '1,250 P is on its way — added automatically now that your trip has ended',
    );
    expect(section.textContent).not.toContain('Review this trip to earn');
    // Tier disclaimer.
    expect(section.textContent).toContain('current membership tier');
    // Reviews are a SEPARATE reward, stated without an amount.
    expect(section.textContent).toContain(en['credits.pending_review_separate']);
    const reviewCta = screen.getByRole('link', { name: 'Write a review →' });
    expect(reviewCta.getAttribute('href')).toBe('/my-page/travel-history/42/reviews');
    const tripCta = screen.getByRole('link', { name: 'View trip →' });
    expect(tripCta.getAttribute('href')).toBe('/my-page/travel-history/42');
  });

  it('maps the legacy awaiting_review wire value to the same completion copy', async () => {
    mockApi([], [projection({ blocking_reason: 'awaiting_review' })]);

    render(<MyCreditsPage />);

    const section = await screen.findByTestId('pending-earnings');
    expect(section.textContent).toContain(
      '500 P is on its way — added automatically now that your trip has ended',
    );
    expect(section.textContent).not.toContain('Review this trip');
    expect(section.textContent).toContain(en['credits.pending_review_separate']);
  });

  it('shows the after-trip copy (no reviews link) for a not-finished trip', async () => {
    mockApi(
      [],
      [projection({ trip_id: 66, blocking_reason: 'trip_not_finished', trip_title: null })],
    );

    render(<MyCreditsPage />);

    const section = await screen.findByTestId('pending-earnings');
    // Null title falls back to the localized "Trip {id}" label.
    expect(section.textContent).toContain('Trip 66');
    expect(section.textContent).toContain(
      "You'll earn an estimated 500 P automatically after this trip ends",
    );
    expect(screen.queryByRole('link', { name: 'Write a review →' })).toBeNull();
    const cta = screen.getByRole('link', { name: 'View trip →' });
    expect(cta.getAttribute('href')).toBe('/my-page/travel-history/66');
  });

  it('falls back to cents → points for a USD projection from an older backend', async () => {
    mockApi([], [projection({ projected_points: undefined, projected_amount_cents: 1250 })]);

    render(<MyCreditsPage />);

    await screen.findByTestId('pending-earnings');
    expect(screen.getByTestId('pending-points').textContent).toBe('+1,250 P');
    expect(screen.getByTestId('pending-usd-approx').textContent).toBe('≈ USD 12');
  });

  it('never invents an FX rate: a non-USD legacy projection renders figure-free', async () => {
    mockApi(
      [],
      [projection({ projected_points: undefined, projected_amount_cents: 1250, currency: 'EUR' })],
    );

    render(<MyCreditsPage />);

    const section = await screen.findByTestId('pending-earnings');
    expect(screen.queryByTestId('pending-points')).toBeNull();
    expect(screen.queryByTestId('pending-usd-approx')).toBeNull();
    expect(section.textContent).toContain(en['credits.pending_awaiting_completion_no_figure']);
    expect(section.textContent).not.toContain('EUR');
  });

  it('hides only the USD approximation when the registry is unavailable', async () => {
    benefitsValue = null;
    mockApi([], [projection({})]);

    render(<MyCreditsPage />);

    await screen.findByTestId('pending-earnings');
    expect(screen.getByTestId('pending-points').textContent).toBe('+500 P');
    expect(screen.queryByTestId('pending-usd-approx')).toBeNull();
  });

  it('never adds projected amounts to the available balance', async () => {
    mockApi([ISSUED_CREDIT], [projection({})]);

    render(<MyCreditsPage />);

    await screen.findByTestId('pending-earnings');
    // The balance is the backend-derived 10,000 P and the history row shows
    // the +10,000 P grant — the projected 500 P is never summed in (no
    // 10,500 P anywhere).
    expect(screen.getByTestId('points-balance').textContent).toBe('10,000 P');
    expect(screen.getByTestId('points-delta').textContent).toBe('+10,000 P');
    expect(screen.queryByText('10,500 P')).toBeNull();
  });

  it('hides the section entirely when there are no pending projections', async () => {
    mockApi([ISSUED_CREDIT], []);

    render(<MyCreditsPage />);

    await screen.findByTestId('points-delta');
    expect(screen.queryByTestId('pending-earnings')).toBeNull();
  });

  it('degrades by hiding the section when the projection fetch fails', async () => {
    vi.mocked(apiClient.getMyPoints).mockResolvedValue(ledger([ISSUED_CREDIT]));
    vi.mocked(apiClient.getMyCreditProjection).mockRejectedValue(new Error('boom'));

    render(<MyCreditsPage />);

    // The rest of the page still renders.
    await screen.findByTestId('points-delta');
    await waitFor(() => {
      expect(vi.mocked(apiClient.getMyCreditProjection)).toHaveBeenCalled();
    });
    expect(screen.queryByTestId('pending-earnings')).toBeNull();
  });
});
