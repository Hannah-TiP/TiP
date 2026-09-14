import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import en from '@/translations/en.json';
import type { BenefitsResponse } from '@/types/v2/benefits';

// SMA-359: the earn rate on /my-page/membership is the EFFECTIVE config
// value the benefits payload carries (SMA-326 config store), never the
// static registry default — whatever rate arrives is what renders.

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    lang: 'en',
    setLang: () => {},
    t: (key: string) => (en as Record<string, string>)[key] ?? key,
  }),
}));

vi.mock('next-auth/react', () => ({
  useSession: () => ({ status: 'authenticated', data: { user: { membership: 'cercle' } } }),
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

function payloadWithRate(rate: string): BenefitsResponse {
  return {
    benefits: [
      {
        key: 'tiered_earn',
        kind: 'earn_rate',
        unit: 'rate',
        values_by_tier: { cercle: rate },
        copy: { en: 'Earn points.', kr: '적립.' },
      },
    ],
    resolved: {
      tier: 'cercle',
      benefits: [{ key: 'tiered_earn', unit: 'rate', value: rate }],
    },
  };
}

afterEach(() => {
  cleanup();
  benefitsValue = null;
});

describe('membership page live earn rate (SMA-359)', () => {
  it('renders the rate the payload carries — an admin-configured 0.02 reads 2%', () => {
    benefitsValue = payloadWithRate('0.02');
    render(<MembershipPage />);

    const line = screen.getByTestId('member-earn-rate').textContent ?? '';
    expect(line).toContain('2%');
    expect(line).toContain('Cercle');
    // The registry's static Cercle default (0.5%) must NOT override a live value.
    expect(line).not.toContain('0.5%');
  });

  it('tracks a different live value without any static fallback', () => {
    benefitsValue = payloadWithRate('0.0125');
    render(<MembershipPage />);

    expect(screen.getByTestId('member-earn-rate').textContent).toContain('1.25%');
  });
});
