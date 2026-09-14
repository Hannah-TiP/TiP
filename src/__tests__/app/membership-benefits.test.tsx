import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import en from '@/translations/en.json';
import type { BenefitsResponse } from '@/types/v2/benefits';

type LangValue = 'en' | 'kr';
let currentLang: LangValue = 'en';

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    lang: currentLang,
    setLang: (l: LangValue) => {
      currentLang = l;
    },
    t: (key: string) => (en as Record<string, string>)[key] ?? key,
  }),
}));

vi.mock('next-auth/react', () => ({
  useSession: () => ({ status: 'unauthenticated', data: null }),
}));

vi.mock('@/components/Footer', () => ({
  default: () => <div>Footer</div>,
}));

vi.mock('@/components/FreeNightSummary', () => ({
  default: () => null,
}));

let benefitsValue: BenefitsResponse | null = null;
vi.mock('@/hooks/useBenefits', () => ({
  useBenefits: () => benefitsValue,
}));

import MembershipPage from '@/app/my-page/membership/page';

// Deliberately DIFFERENT from the static fallbacks so a payload-driven
// render is distinguishable from the fallback path.
const PAYLOAD: BenefitsResponse = {
  benefits: [
    {
      key: 'benefit_credit',
      kind: 'per_booking_discount',
      unit: 'usd_cents',
      values_by_tier: {
        carte: '12300',
        cercle: '15000',
        confidence: '20000',
        cenacle: '40000',
      },
      copy: { en: 'Booking credit.', kr: '베네핏 크레딧.' },
    },
    {
      key: 'tiered_earn',
      kind: 'earn_rate',
      unit: 'rate',
      values_by_tier: { carte: '0.001' },
      copy: { en: 'Earn credit.', kr: '적립.' },
    },
    // The Confidence welcome grant is a LEDGER points grant: $500 in USD
    // cents converts to P via the structural `point_unit` entry (SMA-358).
    {
      key: 'point_unit',
      kind: 'unit_definition',
      unit: 'points',
      values_by_tier: { carte: '100', cercle: '100', confidence: '100', cenacle: '100' },
      copy: { en: 'x', kr: 'x' },
    },
    {
      key: 'confidence_welcome',
      kind: 'one_off_grant',
      unit: 'usd_cents',
      values_by_tier: { confidence: '50000' },
      copy: { en: 'Welcome.', kr: '웰컴.' },
    },
  ],
  resolved: {
    tier: 'carte',
    benefits: [{ key: 'tiered_earn', unit: 'rate', value: '0.001' }],
  },
};

afterEach(() => {
  cleanup();
  currentLang = 'en';
  benefitsValue = null;
});

describe('membership page benefit figures (SMA-322)', () => {
  it('renders tier-card money figures from the benefits payload', () => {
    benefitsValue = PAYLOAD;
    render(<MembershipPage />);

    // Carte credit comes from the payload ($123), not the fallback ($100).
    expect(screen.getByText(/Stay Credit — \$123 hotel credit per stay/)).toBeDefined();
    expect(screen.getByText(/Elevated Stay Credit — up to \$150 per booking/)).toBeDefined();
    expect(screen.getByText(/Private Stay Credit — up to \$400 per booking/)).toBeDefined();
  });

  it("shows the member's own earn rate from the resolved block", () => {
    benefitsValue = PAYLOAD;
    render(<MembershipPage />);

    expect(screen.getByTestId('member-earn-rate').textContent).toBe(
      'As a Carte member, you earn 0.1% of your travel spend back in TiP Points.',
    );
  });

  it('renders the Confidence welcome grant in TiP Points, never as a credit (SMA-358)', () => {
    benefitsValue = PAYLOAD;
    render(<MembershipPage />);

    // Qualifying copy appears on the Confidence card AND the summary table.
    const lines = screen.getAllByText(/50,000 P in welcome TiP Points added when you join/);
    expect(lines.length).toBe(2);
    expect(screen.queryByText(/welcome credit/i)).toBeNull();
    expect(screen.queryByText(/\$500/)).toBeNull();
  });

  it('drops the Confidence welcome figure (never invents one) without a payload', () => {
    benefitsValue = null;
    render(<MembershipPage />);

    const lines = screen.getAllByText(/Welcome TiP Points added when you join/);
    expect(lines.length).toBe(2);
    expect(screen.queryByText(/\d\s?P in welcome TiP Points/)).toBeNull();
    expect(screen.queryByText(/welcome credit/i)).toBeNull();
  });

  it('describes the birthday grant as TiP Points, not a credit (SMA-358)', () => {
    benefitsValue = PAYLOAD;
    render(<MembershipPage />);

    expect(
      screen.getByText(
        'Birthday Stay — birthday TiP Points and a private in-room welcome in your birthday month',
      ),
    ).toBeDefined();
    expect(screen.queryByText(/Birthday Stay — dedicated credit/)).toBeNull();
  });

  it('falls back to the static figures and hides the earn-rate line without a payload', () => {
    benefitsValue = null;
    render(<MembershipPage />);

    // Static fallback figures — the page never renders blank.
    expect(screen.getByText(/Stay Credit — \$100 hotel credit per stay/)).toBeDefined();
    expect(screen.getByText(/up to \$150 per booking/)).toBeDefined();
    // Anonymous / endpoint-down: no personal earn-rate line.
    expect(screen.queryByTestId('member-earn-rate')).toBeNull();
  });
});
