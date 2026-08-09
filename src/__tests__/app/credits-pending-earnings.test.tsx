import type { AnchorHTMLAttributes } from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MyCreditsPage from '@/app/my-page/credits/page';
import { apiClient } from '@/lib/api-client';
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
    getMyCredits: vi.fn(),
    getMyCreditProjection: vi.fn(),
  },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const ISSUED_CREDIT: StayCredit = {
  id: 1,
  user_id: 7,
  source: 'welcome',
  status: 'issued',
  amount_cents: 10000,
  currency: 'USD',
  created_at: '2026-05-01T00:00:00Z',
};

function projection(overrides: Partial<ProjectedTripEarn>): ProjectedTripEarn {
  return {
    trip_id: 42,
    trip_title: 'Kyoto Escape',
    eligible_spend_cents: 100000,
    currency: 'USD',
    tier_rate: 0.005,
    projected_amount_cents: 500,
    blocking_reason: 'awaiting_review',
    ...overrides,
  };
}

function mockApi(credits: StayCredit[], projections: ProjectedTripEarn[]) {
  vi.mocked(apiClient.getMyCredits).mockResolvedValue(credits);
  vi.mocked(apiClient.getMyCreditProjection).mockResolvedValue({
    user_id: 7,
    has_paid_trips: true,
    projections,
  });
}

describe('Pending earnings on /my-page/credits', () => {
  it('lists an awaiting-review trip with the ~amount, review copy, and reviews link', async () => {
    mockApi([ISSUED_CREDIT], [projection({})]);

    render(<MyCreditsPage />);

    const section = await screen.findByTestId('pending-earnings');
    expect(section.textContent).toContain('Pending earnings');
    expect(section.textContent).toContain('Kyoto Escape');
    // ~ prefix + "Estimated" wording mark the figure as an estimate.
    expect(section.textContent).toContain('~USD 5.00');
    expect(section.textContent).toContain('Estimated');
    expect(section.textContent).toContain('Review this trip to earn ~USD 5.00');
    // Tier disclaimer.
    expect(section.textContent).toContain('current membership tier');
    const cta = screen.getByRole('link', { name: 'Write a review →' });
    expect(cta.getAttribute('href')).toBe('/my-page/travel-history/42/reviews');
  });

  it('links a not-finished trip to the trip page with the after-trip copy', async () => {
    mockApi(
      [],
      [projection({ trip_id: 66, blocking_reason: 'trip_not_finished', trip_title: null })],
    );

    render(<MyCreditsPage />);

    const section = await screen.findByTestId('pending-earnings');
    // Null title falls back to the localized "Trip {id}" label.
    expect(section.textContent).toContain('Trip 66');
    expect(section.textContent).toContain("You'll earn ~USD 5.00 after this trip");
    const cta = screen.getByRole('link', { name: 'View trip →' });
    expect(cta.getAttribute('href')).toBe('/my-page/travel-history/66');
  });

  it('never adds projected amounts to the available balance', async () => {
    mockApi([ISSUED_CREDIT], [projection({})]);

    render(<MyCreditsPage />);

    await screen.findByTestId('pending-earnings');
    // Balance card + history row both show the issued USD 100.00 — the
    // projected 5.00 is never summed in (no USD 105.00 anywhere).
    expect(screen.getAllByText('USD 100.00').length).toBeGreaterThan(0);
    expect(screen.queryByText('USD 105.00')).toBeNull();
  });

  it('hides the section entirely when there are no pending projections', async () => {
    mockApi([ISSUED_CREDIT], []);

    render(<MyCreditsPage />);

    await screen.findAllByText('USD 100.00');
    expect(screen.queryByTestId('pending-earnings')).toBeNull();
  });

  it('degrades by hiding the section when the projection fetch fails', async () => {
    vi.mocked(apiClient.getMyCredits).mockResolvedValue([ISSUED_CREDIT]);
    vi.mocked(apiClient.getMyCreditProjection).mockRejectedValue(new Error('boom'));

    render(<MyCreditsPage />);

    // The rest of the page still renders.
    await screen.findAllByText('USD 100.00');
    await waitFor(() => {
      expect(vi.mocked(apiClient.getMyCreditProjection)).toHaveBeenCalled();
    });
    expect(screen.queryByTestId('pending-earnings')).toBeNull();
  });
});
