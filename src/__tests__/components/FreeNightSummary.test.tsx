import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import enTranslations from '@/translations/en.json';
import type { MemberFreeNightSummary } from '@/types/free-night';

const getMyFreeNights = vi.fn();

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    getMyFreeNights: (...args: unknown[]) => getMyFreeNights(...args),
  },
}));

// `t` mirrors the real one: a plain catalog lookup. Placeholder substitution
// is done by the component via String.replace on the returned template.
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    lang: 'en',
    setLang: () => {},
    t: (key: string) => (enTranslations as Record<string, string>)[key] ?? key,
  }),
}));

import FreeNightSummary from '@/components/FreeNightSummary';

function summary(overrides: Partial<MemberFreeNightSummary>): MemberFreeNightSummary {
  return {
    tier: 'confidence',
    accrues: true,
    threshold: 10,
    current_nights: 6,
    nights_to_next: 4,
    awarded: [],
    ...overrides,
  };
}

afterEach(cleanup);
beforeEach(() => getMyFreeNights.mockReset());

describe('FreeNightSummary', () => {
  it('renders nothing for a tier that does not accrue (Carte)', async () => {
    getMyFreeNights.mockResolvedValue(
      summary({
        tier: 'carte',
        accrues: false,
        threshold: null,
        current_nights: null,
        nights_to_next: null,
      }),
    );
    const { container } = render(<FreeNightSummary />);
    await waitFor(() => expect(getMyFreeNights).toHaveBeenCalled());
    expect(container.querySelector('[data-testid="free-night-summary"]')).toBeNull();
  });

  it('shows Confidence progress and the nights-to-next copy', async () => {
    getMyFreeNights.mockResolvedValue(summary({ current_nights: 6, nights_to_next: 4 }));
    render(<FreeNightSummary />);
    await waitFor(() => expect(screen.getByTestId('free-night-summary')).toBeTruthy());
    expect(screen.getByText('6 of 10 nights')).toBeTruthy();
    expect(screen.getByText('4 more nights until your next free night')).toBeTruthy();
    // Progress bar reflects 60%.
    const bar = screen.getByTestId('free-night-progress-bar') as HTMLElement;
    expect(bar.style.width).toBe('60%');
  });

  it('shows the ready message when a free night is earned', async () => {
    getMyFreeNights.mockResolvedValue(summary({ current_nights: 0, nights_to_next: 0 }));
    render(<FreeNightSummary />);
    await waitFor(() => expect(screen.getByTestId('free-night-summary')).toBeTruthy());
    expect(
      screen.getByText(
        "You've earned a free night — our concierge will apply it to your next qualifying stay.",
      ),
    ).toBeTruthy();
  });

  it('lists awarded free nights with their status', async () => {
    getMyFreeNights.mockResolvedValue(
      summary({
        tier: 'cenacle',
        threshold: null,
        current_nights: null,
        nights_to_next: null,
        awarded: [
          {
            id: 1,
            user_id: 9,
            tier_at_award: 'cenacle',
            kind: 'awarded',
            status: 'awarded',
            accrual_period: 2026,
            qualifying_nights: 7,
            awarded_at: '2026-06-01T00:00:00Z',
            redeemed_at: null,
            fulfilled_by_admin_id: null,
            source_ref: 'trip:1:cenacle:2026:stay:0',
            notes: 'trip:1',
            schema_version: 1,
            created_at: '2026-06-01T00:00:00Z',
            updated_at: null,
          },
        ],
      }),
    );
    render(<FreeNightSummary />);
    await waitFor(() => expect(screen.getByTestId('free-night-awarded-list')).toBeTruthy());
    // Cénacle has no cumulative progress bar.
    expect(screen.queryByTestId('free-night-progress-bar')).toBeNull();
    expect(screen.getByText('Available')).toBeTruthy();
  });
});
