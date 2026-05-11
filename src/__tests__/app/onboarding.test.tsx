/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-unused-vars */
import type { AnchorHTMLAttributes, ImgHTMLAttributes } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import OnboardingPage from '@/app/onboarding/page';
import { apiClient } from '@/lib/api-client';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
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

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('OnboardingPage', () => {
  it('renders city autocomplete input on the location step', async () => {
    // referral_onboarding_seen=true so getStartStep skips past the new
    // referral step and lands on Location (the next missing required
    // field given name is filled but city is null).
    vi.mocked(apiClient.getProfile).mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      first_name: 'Ephie',
      last_name: 'Park',
      city_id: null,
      onboarding_completed: false,
      referral_onboarding_seen: true,
      is_verified: true,
    });
    vi.mocked(apiClient.getMyReferrals).mockResolvedValue({
      code: 'ABCD1234',
      referrals: [],
      referred_by: null,
    });

    render(<OnboardingPage />);

    expect(await screen.findByText('Where do you call home?')).toBeTruthy();
    expect(screen.getByPlaceholderText('Search your city...')).toBeTruthy();
  });

  it('shows the referral input step for users who have not seen it yet', async () => {
    vi.mocked(apiClient.getProfile).mockResolvedValue({
      id: 2,
      email: 'new@example.com',
      is_verified: true,
      onboarding_completed: false,
      referral_onboarding_seen: false,
    });
    vi.mocked(apiClient.getMyReferrals).mockResolvedValue({
      code: 'XYZW7890',
      referrals: [],
      referred_by: null,
    });

    render(<OnboardingPage />);

    expect(await screen.findByText('Were you invited?')).toBeTruthy();
    expect(screen.getByPlaceholderText('ABCD1234')).toBeTruthy();
  });

  it('shows the "you\'re invited" welcome when referred_by is populated', async () => {
    vi.mocked(apiClient.getProfile).mockResolvedValue({
      id: 3,
      email: 'invited@example.com',
      is_verified: true,
      onboarding_completed: false,
      referral_onboarding_seen: false,
    });
    vi.mocked(apiClient.getMyReferrals).mockResolvedValue({
      code: 'MYCODE12',
      referrals: [],
      referred_by: {
        id: 99,
        referrer_user_id: 42,
        referee_user_id: 3,
        referrer_credit_id: 1,
        referee_credit_id: 2,
        referrer_tier_at_claim: 'cercle',
        claimed_at: '2026-05-10T00:00:00Z',
      },
    });

    render(<OnboardingPage />);

    expect(await screen.findByText("You're invited")).toBeTruthy();
    // Skip button is hidden when already invited — only Continue advances.
    expect(screen.queryByText('Skip')).toBeNull();
  });
});
