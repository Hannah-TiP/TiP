import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MyReferralsPage from '@/app/my-page/referrals/page';
import { apiClient } from '@/lib/api-client';
import en from '@/translations/en.json';
import kr from '@/translations/kr.json';
import type { BenefitsResponse } from '@/types/v2/benefits';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('next-auth/react', () => ({
  useSession: () => ({ status: 'authenticated' }),
}));

vi.mock('@/components/Footer', () => ({
  default: () => <div>Footer</div>,
}));

let langValue: 'en' | 'kr' = 'en';
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    lang: langValue,
    setLang: vi.fn(),
    t: (key: string) =>
      ((langValue === 'en' ? en : kr) as Record<string, string>)[key] ??
      (en as Record<string, string>)[key] ??
      key,
  }),
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    getMyReferrals: vi.fn(),
  },
}));

let benefitsValue: BenefitsResponse | null = null;
vi.mock('@/hooks/useBenefits', () => ({
  useBenefits: () => benefitsValue,
}));

// Wire-shaped registry payload: `point_unit` (100 P = 1 USD) plus the
// tiered `referral_joiner_credit` in USD cents, resolved for a Confidence
// member (the joiner reward keys off the REFERRER's tier).
function payload(tier: 'carte' | 'confidence'): BenefitsResponse {
  const cents = tier === 'carte' ? '5000' : '30000';
  return {
    benefits: [
      {
        key: 'point_unit',
        kind: 'unit_definition',
        unit: 'points',
        values_by_tier: { carte: '100', cercle: '100', confidence: '100', cenacle: '100' },
        copy: { en: 'x', kr: 'x' },
      },
      {
        key: 'referral_joiner_credit',
        kind: 'one_off_grant',
        unit: 'usd_cents',
        values_by_tier: { carte: '5000', cercle: '5000', confidence: '30000', cenacle: '30000' },
        copy: { en: 'x', kr: 'x' },
      },
    ],
    resolved: {
      tier,
      benefits: [
        { key: 'point_unit', unit: 'points', value: '100' },
        { key: 'referral_joiner_credit', unit: 'usd_cents', value: cents },
      ],
    },
  };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  benefitsValue = null;
  langValue = 'en';
});

function mockReferrals(withCredit: boolean) {
  vi.mocked(apiClient.getMyReferrals).mockResolvedValue({
    code: 'ABCD1234',
    referrals: [
      {
        id: 1,
        referrer_user_id: 7,
        referee_user_id: 99,
        referee_credit_id: withCredit ? 55 : null,
        claimed_at: '2026-09-01T00:00:00Z',
      },
    ],
    referred_by: null,
  });
}

describe('/my-page/referrals points copy (SMA-358)', () => {
  it('derives the joiner reward in P from the resolved registry value', async () => {
    benefitsValue = payload('confidence');
    mockReferrals(true);

    render(<MyReferralsPage />);

    expect((await screen.findByTestId('referrals-intro')).textContent).toBe(
      'As a Confidence member, each friend you invite receives 30,000 P in TiP Points when they join through your code.',
    );
    // A different referrer tier yields a different figure — never a literal.
    cleanup();
    benefitsValue = payload('carte');
    render(<MyReferralsPage />);
    expect((await screen.findByTestId('referrals-intro')).textContent).toContain(
      'As a Carte member, each friend you invite receives 5,000 P',
    );
  });

  it('describes the referral status as points, not credit', async () => {
    benefitsValue = payload('carte');
    mockReferrals(true);

    render(<MyReferralsPage />);

    expect(await screen.findByText('Points sent')).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/credit/i);
    expect(document.body.textContent).not.toContain('$');
  });

  it('degrades to figure-free copy when the registry is unavailable', async () => {
    benefitsValue = null;
    mockReferrals(false);

    render(<MyReferralsPage />);

    expect((await screen.findByTestId('referrals-intro')).textContent).toBe(en['referrals.intro']);
    expect(await screen.findByText('Joined')).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/\d\s?P\b/);
  });

  it('renders the Korean copy with the derived figure', async () => {
    langValue = 'kr';
    benefitsValue = payload('confidence');
    mockReferrals(true);

    render(<MyReferralsPage />);

    expect((await screen.findByTestId('referrals-intro')).textContent).toBe(
      'Confidence 멤버인 회원님의 추천 코드로 가입한 친구에게는 30,000 P의 TiP 포인트가 적립됩니다.',
    );
    expect(await screen.findByText('포인트 전달')).toBeTruthy();
    expect(document.body.textContent).not.toContain('크레딧');
  });
});
