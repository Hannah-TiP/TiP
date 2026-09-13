import type { AnchorHTMLAttributes } from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MyCreditsPage from '@/app/my-page/credits/page';
import { apiClient } from '@/lib/api-client';
import en from '@/translations/en.json';
import kr from '@/translations/kr.json';
import type { PointTransaction, PointsLedgerResponse } from '@/types/stay-credit';
import type { BenefitsResponse } from '@/types/v2/benefits';

// SoT v1.1 §6 golden vector (SMA-332): the TiP Points wallet renders ONE
// balance in P with a USD approximation alongside, and a history of EVERY
// ledger row (grants AND spends) with signed points and a never-blank
// expiry cell.

const state = vi.hoisted(() => ({
  lang: 'en' as 'en' | 'kr',
  benefits: null as BenefitsResponse | null,
  // Stable router object (like the real one) — a fresh object per render
  // would re-fire the page's fetch effect and inflate call counts.
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
  default: ({ onRedeemed }: { onRedeemed: () => void }) => (
    <button type="button" data-testid="fake-redeem" onClick={onRedeemed}>
      redeem
    </button>
  ),
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
  useBenefits: () => state.benefits,
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    getMyPoints: vi.fn(),
    getMyCreditProjection: vi.fn(),
  },
}));

// Registry payload carrying the SMA-332 `point_unit` structural entry
// (points per 1 USD) plus copy for the sources that have active entries.
// `review_reward` is inactive in the registry (never in the payload) and
// `manual` has no entry here, so both resolve via the static fallbacks.
const BENEFITS_WITH_UNIT: BenefitsResponse = {
  benefits: [
    {
      key: 'point_unit',
      kind: 'unit_definition',
      unit: 'points',
      values_by_tier: { carte: '100', cercle: '100', confidence: '100', cenacle: '100' },
      copy: { en: 'TiP Points: 100 P = USD 1.', kr: 'TiP 포인트: 100 P = USD 1.' },
    },
    {
      key: 'tiered_earn',
      kind: 'earn_rate',
      unit: 'rate',
      values_by_tier: { carte: '0.001' },
      copy: { en: 'Trip points', kr: '여행 적립' },
    },
    {
      key: 'promo_code_redemption',
      kind: 'one_off_grant',
      unit: null,
      values_by_tier: null,
      copy: { en: 'Promo code', kr: '프로모션 코드' },
    },
  ],
  resolved: {
    tier: 'carte',
    benefits: [{ key: 'point_unit', unit: 'points', value: '100' }],
  },
};

function row(overrides: Partial<PointTransaction> & { id: number }): PointTransaction {
  return {
    user_id: 7,
    source: 'manual',
    status: 'issued',
    kind: 'grant',
    delta_points: 0,
    created_at: '2026-05-01T00:00:00Z',
    expires_at: '2028-05-01T00:00:00Z',
    ...overrides,
  };
}

// Newest first, as the backend serves them.
const GOLDEN_ROWS: PointTransaction[] = [
  row({
    id: 4,
    source: 'promo_code_redemption',
    delta_points: 2000,
    promo_code: 'WELCOME26',
    created_at: '2026-09-04T00:00:00Z',
  }),
  row({ id: 3, source: 'review_reward', delta_points: 1000, created_at: '2026-09-03T00:00:00Z' }),
  row({
    id: 2,
    source: 'payment_points',
    delta_points: 10000,
    source_ref: 'trip:42:tiered_earn',
    created_at: '2026-09-02T00:00:00Z',
  }),
  row({ id: 1, source: 'manual', delta_points: 11500, created_at: '2026-09-01T00:00:00Z' }),
];

const GOLDEN_LEDGER: PointsLedgerResponse = {
  user_id: 7,
  balance_points: 24500,
  transactions: GOLDEN_ROWS,
};

function mockApi(ledger: PointsLedgerResponse) {
  vi.mocked(apiClient.getMyPoints).mockResolvedValue(ledger);
  vi.mocked(apiClient.getMyCreditProjection).mockResolvedValue({
    user_id: 7,
    has_paid_trips: false,
    projections: [],
  });
}

beforeEach(() => {
  state.lang = 'en';
  state.benefits = BENEFITS_WITH_UNIT;
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('TiP Points wallet on /my-page/credits (SoT v1.1 §6 golden vector)', () => {
  it('EN: renders 24,500 P, ≈ USD 245, and every grant row with a + sign, newest first', async () => {
    mockApi(GOLDEN_LEDGER);

    render(<MyCreditsPage />);

    expect((await screen.findByTestId('points-balance')).textContent).toBe('24,500 P');
    expect(screen.getByTestId('points-usd-approx').textContent).toBe('≈ USD 245');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('TiP Points');

    const rows = await screen.findAllByTestId('points-row');
    expect(rows).toHaveLength(4);
    expect(rows.map((r) => within(r).getByTestId('points-delta').textContent)).toEqual([
      '+2,000 P',
      '+1,000 P',
      '+10,000 P',
      '+11,500 P',
    ]);
    // Reason cell = source label (registry copy wins; static fallback
    // otherwise) + the promo code suffix; grant rows carry NO kind qualifier.
    expect(rows[0].textContent).toContain('Promo code');
    expect(rows[0].textContent).toContain('· WELCOME26');
    expect(rows[1].textContent).toContain('Review Reward');
    expect(rows[2].textContent).toContain('Trip points');
    expect(rows[3].textContent).toContain('Concierge');
    expect(screen.queryAllByTestId('points-kind')).toHaveLength(0);
    // Trip-linked grant keeps its View trip link.
    const link = within(rows[2]).getByRole('link', { name: 'View trip →' });
    expect(link.getAttribute('href')).toBe('/my-page/travel-history/42');
    expect(within(rows[3]).queryByRole('link')).toBeNull();
    // Column headers.
    const history = screen.getByTestId('points-history');
    for (const label of ['Reason', 'Points', 'Earned', 'Expires']) {
      expect(history.textContent).toContain(label);
    }
  });

  it('KR: renders 24,500 P with 약 USD 245 상당 and the §6 column headers', async () => {
    state.lang = 'kr';
    mockApi(GOLDEN_LEDGER);

    render(<MyCreditsPage />);

    expect((await screen.findByTestId('points-balance')).textContent).toBe('24,500 P');
    expect(screen.getByTestId('points-usd-approx').textContent).toBe('약 USD 245 상당');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('TiP 포인트');

    const history = await screen.findByTestId('points-history');
    for (const label of ['적립 사유', '포인트', '적립일', '만료일']) {
      expect(history.textContent).toContain(label);
    }
    const rows = screen.getAllByTestId('points-row');
    expect(rows[0].textContent).toContain('프로모션 코드');
    expect(rows[1].textContent).toContain('리뷰 보상');
    expect(rows[2].textContent).toContain('여행 적립');
    expect(rows[3].textContent).toContain('컨시어지');
    expect(
      rows.every((r) => within(r).getByTestId('points-delta').textContent?.startsWith('+')),
    ).toBe(true);
  });

  it('KR: spends/expiries render a real minus sign, a kind qualifier, and 해당 없음; no-expiry lots read 무기한', async () => {
    state.lang = 'kr';
    mockApi({
      user_id: 7,
      balance_points: 9700,
      transactions: [
        row({
          id: 14,
          source: 'manual',
          kind: 'expire',
          delta_points: -300,
          consumes_transaction_id: 11,
          expires_at: null,
          created_at: '2026-09-05T00:00:00Z',
        }),
        row({
          id: 13,
          source: 'manual',
          kind: 'clawback',
          delta_points: -1000,
          consumes_transaction_id: 11,
          expires_at: null,
        }),
        row({
          id: 12,
          source: 'payment_points',
          kind: 'use',
          delta_points: -1200,
          consumes_transaction_id: 11,
          expires_at: null,
        }),
        // Grandfathered perpetual lot (null expires_at) — never blank.
        row({ id: 11, source: 'manual', kind: 'grant', delta_points: 12200, expires_at: null }),
      ],
    });

    render(<MyCreditsPage />);

    const rows = await screen.findAllByTestId('points-row');
    expect(rows).toHaveLength(4);
    const deltas = rows.map((r) => within(r).getByTestId('points-delta').textContent);
    expect(deltas).toEqual(['−300 P', '−1,000 P', '−1,200 P', '+12,200 P']);
    // Real minus sign U+2212 — never an ASCII hyphen.
    expect(deltas.some((d) => d?.includes('-'))).toBe(false);

    expect(within(rows[0]).getByTestId('points-kind').textContent).toBe('만료');
    expect(within(rows[1]).getByTestId('points-kind').textContent).toBe('회수');
    expect(within(rows[2]).getByTestId('points-kind').textContent).toBe('예약에 사용');
    expect(within(rows[3]).queryByTestId('points-kind')).toBeNull();

    const expiries = rows.map((r) => within(r).getByTestId('points-expiry').textContent);
    expect(expiries[0]).toContain('해당 없음');
    expect(expiries[1]).toContain('해당 없음');
    expect(expiries[2]).toContain('해당 없음');
    expect(expiries[3]).toContain('무기한');
    expect(expiries[3]).not.toContain('해당 없음');
  });

  it('EN: a returned booking (cancel) row is a positive lot with its own expiry and qualifier', async () => {
    mockApi({
      user_id: 7,
      balance_points: 1200,
      transactions: [
        row({
          id: 22,
          source: 'payment_points',
          kind: 'cancel',
          delta_points: 1200,
          consumes_transaction_id: 21,
          expires_at: '2028-01-15T00:00:00Z',
        }),
      ],
    });

    render(<MyCreditsPage />);

    const [only] = await screen.findAllByTestId('points-row');
    expect(within(only).getByTestId('points-delta').textContent).toBe('+1,200 P');
    expect(within(only).getByTestId('points-kind').textContent).toBe(
      'Returned — booking cancelled',
    );
    const expiry = within(only).getByTestId('points-expiry').textContent ?? '';
    expect(expiry).toContain('2028');
    expect(expiry).not.toContain('N/A');
  });

  it('still renders the balance and the row when the backend sends an unknown ledger kind', async () => {
    // A backend enum member the FE label map does not know yet (shared
    // preview/prod DB deploys backend-first) must degrade to the raw slug
    // qualifier — never a TypeError that blanks the whole wallet.
    mockApi({
      user_id: 7,
      balance_points: 24500,
      transactions: [
        row({
          id: 31,
          source: 'manual',
          kind: 'future_kind' as PointTransaction['kind'],
          delta_points: -500,
          created_at: '2026-09-06T00:00:00Z',
        }),
        row({ id: 30, source: 'manual', delta_points: 25000 }),
      ],
    });

    render(<MyCreditsPage />);

    expect((await screen.findByTestId('points-balance')).textContent).toBe('24,500 P');
    const rows = await screen.findAllByTestId('points-row');
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByTestId('points-delta').textContent).toBe('−500 P');
    expect(within(rows[0]).getByTestId('points-kind').textContent).toBe('future_kind');
    expect(within(rows[1]).getByTestId('points-delta').textContent).toBe('+25,000 P');
    expect(within(rows[1]).queryByTestId('points-kind')).toBeNull();
  });

  it('still renders the balance and hides the USD line when the registry has no point_unit', async () => {
    state.benefits = null;
    mockApi(GOLDEN_LEDGER);

    render(<MyCreditsPage />);

    expect((await screen.findByTestId('points-balance')).textContent).toBe('24,500 P');
    expect(screen.queryByTestId('points-usd-approx')).toBeNull();
    // Labels degrade to the static fallbacks — no crash, no raw key.
    const rows = await screen.findAllByTestId('points-row');
    expect(rows[2].textContent).toContain('Trip cashback');
  });

  it('hides the USD line when point_unit is present but not a positive number', async () => {
    state.benefits = {
      benefits: [
        {
          key: 'point_unit',
          kind: 'unit_definition',
          unit: 'points',
          values_by_tier: { carte: '0' },
          copy: { en: 'x', kr: 'x' },
        },
      ],
      resolved: null,
    };
    mockApi(GOLDEN_LEDGER);

    render(<MyCreditsPage />);

    expect((await screen.findByTestId('points-balance')).textContent).toBe('24,500 P');
    expect(screen.queryByTestId('points-usd-approx')).toBeNull();
  });

  it('empty ledger: 0 P, ≈ USD 0, and the empty-state message', async () => {
    mockApi({ user_id: 7, balance_points: 0, transactions: [] });

    render(<MyCreditsPage />);

    expect((await screen.findByTestId('points-balance')).textContent).toBe('0 P');
    expect(screen.getByTestId('points-usd-approx').textContent).toBe('≈ USD 0');
    expect((await screen.findByTestId('points-empty')).textContent).toBe(en['credits.empty']);
    expect(screen.queryByTestId('points-history')).toBeNull();
  });

  it('KR empty ledger reads 약 USD 0 상당', async () => {
    state.lang = 'kr';
    mockApi({ user_id: 7, balance_points: 0, transactions: [] });

    render(<MyCreditsPage />);

    expect((await screen.findByTestId('points-balance')).textContent).toBe('0 P');
    expect(screen.getByTestId('points-usd-approx').textContent).toBe('약 USD 0 상당');
    expect((await screen.findByTestId('points-empty')).textContent).toBe(kr['credits.empty']);
  });

  it('shows the localized error state when the ledger fetch fails', async () => {
    vi.mocked(apiClient.getMyPoints).mockRejectedValue(new Error(''));
    vi.mocked(apiClient.getMyCreditProjection).mockResolvedValue({
      user_id: 7,
      has_paid_trips: false,
      projections: [],
    });

    render(<MyCreditsPage />);

    expect(await screen.findByText(en['credits.error_load'])).toBeTruthy();
    expect(screen.queryByTestId('points-history')).toBeNull();
  });

  it('reloads the points ledger after a code is redeemed', async () => {
    mockApi(GOLDEN_LEDGER);

    render(<MyCreditsPage />);
    await screen.findByTestId('points-balance');
    expect(vi.mocked(apiClient.getMyPoints)).toHaveBeenCalledTimes(1);

    vi.mocked(apiClient.getMyPoints).mockResolvedValue({
      ...GOLDEN_LEDGER,
      balance_points: 26500,
    });
    fireEvent.click(screen.getByTestId('fake-redeem'));

    await waitFor(() => {
      expect(screen.getByTestId('points-balance').textContent).toBe('26,500 P');
    });
    expect(vi.mocked(apiClient.getMyPoints)).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId('points-usd-approx').textContent).toBe('≈ USD 265');
  });
});
