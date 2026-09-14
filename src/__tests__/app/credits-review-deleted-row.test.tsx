import type { AnchorHTMLAttributes } from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MyCreditsPage from '@/app/my-page/credits/page';
import { apiClient } from '@/lib/api-client';
import en from '@/translations/en.json';
import kr from '@/translations/kr.json';
import type { PointTransaction, PointsLedgerResponse } from '@/types/stay-credit';

// A `clawback` row the backend appends when a member deletes an approved
// review (`notes: 'review_deleted'`, SMA-363) is labelled "Review deleted"
// and never shows the raw marker; every other clawback keeps the generic
// "Clawback" qualifier and its free-text note.

const state = vi.hoisted(() => ({
  lang: 'en' as 'en' | 'kr',
  router: { push: vi.fn() },
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

vi.mock('next/navigation', () => ({
  useRouter: () => state.router,
}));

vi.mock('next-auth/react', () => ({
  useSession: () => ({ status: 'authenticated' }),
}));

vi.mock('@/components/Footer', () => ({
  default: () => <div>Footer</div>,
}));

vi.mock('@/components/credits/RedeemCodeSection', () => ({
  default: () => <div data-testid="fake-redeem" />,
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => {
    const table = (state.lang === 'en' ? en : kr) as Record<string, string>;
    return {
      lang: state.lang,
      setLang: vi.fn(),
      t: (key: string) => table[key] ?? key,
    };
  },
}));

vi.mock('@/hooks/useBenefits', () => ({
  useBenefits: () => null,
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    getMyPoints: vi.fn(),
    getMyCreditProjection: vi.fn(),
  },
}));

function row(overrides: Partial<PointTransaction> & { id: number }): PointTransaction {
  return {
    user_id: 7,
    source: 'review_reward',
    status: 'issued',
    kind: 'clawback',
    delta_points: -500,
    created_at: '2026-09-05T00:00:00Z',
    expires_at: null,
    ...overrides,
  };
}

const LEDGER: PointsLedgerResponse = {
  user_id: 7,
  balance_points: 0,
  transactions: [
    row({ id: 3, notes: 'review_deleted', trip_id: 42 }),
    row({ id: 2, source: 'manual', notes: 'Fraud check' }),
    row({
      id: 1,
      kind: 'grant',
      delta_points: 500,
      notes: 'text',
      trip_id: 42,
      created_at: '2026-09-01T00:00:00Z',
    }),
  ],
};

beforeEach(() => {
  state.lang = 'en';
  vi.mocked(apiClient.getMyPoints).mockResolvedValue(LEDGER);
  vi.mocked(apiClient.getMyCreditProjection).mockResolvedValue({
    user_id: 7,
    has_paid_trips: false,
    projections: [],
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('Review-deleted clawback rows on /my-page/credits (SMA-363)', () => {
  it('EN: labels the row "Review deleted", hides the marker, keeps other clawbacks generic', async () => {
    render(<MyCreditsPage />);

    const rows = await screen.findAllByTestId('points-row');
    expect(rows).toHaveLength(3);

    const deleted = rows[0];
    expect(within(deleted).getByTestId('points-kind').textContent).toBe('Review deleted');
    expect(deleted.textContent).not.toContain('review_deleted');
    expect(within(deleted).getByTestId('points-delta').textContent).toBe('−500 P');
    expect(within(deleted).getByTestId('points-expiry').textContent).toContain('N/A');

    const manual = rows[1];
    expect(within(manual).getByTestId('points-kind').textContent).toBe('Clawback');
    expect(manual.textContent).toContain('Fraud check');

    // The grant it reverses carries no qualifier.
    expect(within(rows[2]).queryByTestId('points-kind')).toBeNull();
  });

  it('KR: renders 후기 삭제 for the review-deleted row and 회수 for other clawbacks', async () => {
    state.lang = 'kr';
    render(<MyCreditsPage />);

    const rows = await screen.findAllByTestId('points-row');
    expect(within(rows[0]).getByTestId('points-kind').textContent).toBe('후기 삭제');
    expect(rows[0].textContent).not.toContain('review_deleted');
    expect(within(rows[1]).getByTestId('points-kind').textContent).toBe('회수');
  });
});
