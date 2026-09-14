/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-unused-vars */
import type { AnchorHTMLAttributes, ImgHTMLAttributes } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import OnboardingPage from '@/app/onboarding/page';
import { apiClient } from '@/lib/api-client';
import en from '@/translations/en.json';
import type { BenefitsResponse } from '@/types/v2/benefits';

// The invite step quotes the registry's LARGEST `referral_joiner_credit`
// value as "up to {points}" — the joiner reward keys off the inviter's tier,
// which the joiner cannot see (SMA-358).

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next/image', () => ({
  default: ({
    fill: _fill,
    ...props
  }: ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean }) => (
    <img {...props} alt={props.alt} />
  ),
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

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    getMyReferrals: vi.fn(),
    claimReferral: vi.fn(),
    getCityById: vi.fn(),
    searchCities: vi.fn(),
  },
}));

let benefitsValue: BenefitsResponse | null = null;
vi.mock('@/hooks/useBenefits', () => ({
  useBenefits: () => benefitsValue,
}));

// `point_unit` (100 P = 1 USD) + the tiered joiner reward in USD cents:
// $50 at Carte/Cercle, $300 at Confidence/Cénacle ⇒ "up to 30,000 P".
const PAYLOAD: BenefitsResponse = {
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
  resolved: null,
};

function seedInviteStep(referredBy: boolean) {
  vi.mocked(apiClient.getProfile).mockResolvedValue({
    id: 7,
    email: 'joiner@example.com',
    is_verified: true,
    onboarding_completed: false,
    referral_onboarding_seen: false,
  });
  vi.mocked(apiClient.getMyReferrals).mockResolvedValue({
    code: 'MYCODE12',
    referrals: [],
    referred_by: referredBy
      ? {
          id: 99,
          referrer_user_id: 42,
          referee_user_id: 7,
          referrer_credit_id: 1,
          referee_credit_id: 2,
          referrer_tier_at_claim: 'cercle',
          claimed_at: '2026-05-10T00:00:00Z',
        }
      : null,
  });
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  benefitsValue = null;
});

describe('onboarding invite step points copy (SMA-358)', () => {
  it('quotes "up to 30,000 P" from the registry for an un-invited joiner', async () => {
    benefitsValue = PAYLOAD;
    seedInviteStep(false);
    render(<OnboardingPage />);

    expect(await screen.findByText('Were you invited?')).toBeTruthy();
    expect(
      screen.getByText(
        'If a TiP member shared a code with you, up to 30,000 P in TiP Points will be added to your account.',
      ),
    ).toBeTruthy();
  });

  it('quotes "up to 30,000 P" from the registry for an already-invited joiner', async () => {
    benefitsValue = PAYLOAD;
    seedInviteStep(true);
    render(<OnboardingPage />);

    expect(await screen.findByText("You're invited")).toBeTruthy();
    expect(
      screen.getByText(
        'Welcome to TiP — your invitation reward of up to 30,000 P has been added to your TiP Points.',
      ),
    ).toBeTruthy();
  });

  it('drops the figure (never invents one) when the registry is unavailable', async () => {
    benefitsValue = null;
    seedInviteStep(false);
    render(<OnboardingPage />);

    expect(await screen.findByText('Were you invited?')).toBeTruthy();
    const body = screen.getByText(en['onboarding.invited_body_no']);
    expect(body.textContent).not.toMatch(/\d\s?P\b/);
    expect(body.textContent).not.toMatch(/credit/i);
  });
});
