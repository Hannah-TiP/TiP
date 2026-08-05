/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-unused-vars */
import type { AnchorHTMLAttributes, ImgHTMLAttributes } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import OnboardingPage from '@/app/onboarding/page';
import { apiClient } from '@/lib/api-client';

let mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useSearchParams: () => mockSearchParams,
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
  mockSearchParams = new URLSearchParams();
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

  it('does NOT claim a prefilled ?ref= code when the user presses Skip (SMA-267)', async () => {
    mockSearchParams = new URLSearchParams('ref=FRIEND12');
    vi.mocked(apiClient.getProfile).mockResolvedValue({
      id: 4,
      email: 'skipper@example.com',
      is_verified: true,
      onboarding_completed: false,
      referral_onboarding_seen: false,
    });
    vi.mocked(apiClient.getMyReferrals).mockResolvedValue({
      code: 'MYCODE12',
      referrals: [],
      referred_by: null,
    });
    vi.mocked(apiClient.updateProfile).mockResolvedValue(undefined);

    render(<OnboardingPage />);

    // The prefilled code stays visible in the input.
    const input = (await screen.findByPlaceholderText('ABCD1234')) as HTMLInputElement;
    expect(input.value).toBe('FRIEND12');

    fireEvent.click(screen.getByText('Skip'));

    // Skip still persists referral_onboarding_seen and advances to Name...
    await waitFor(() => {
      expect(apiClient.updateProfile).toHaveBeenCalledWith(
        { referral_onboarding_seen: true },
        expect.anything(),
      );
    });
    expect(await screen.findByText('Welcome to TiP')).toBeTruthy();
    // ...but the prefilled code is never claimed.
    expect(apiClient.claimReferral).not.toHaveBeenCalled();
  });

  it('still claims the code when the user presses Continue (regression guard)', async () => {
    mockSearchParams = new URLSearchParams('ref=FRIEND12');
    vi.mocked(apiClient.getProfile).mockResolvedValue({
      id: 5,
      email: 'claimer@example.com',
      is_verified: true,
      onboarding_completed: false,
      referral_onboarding_seen: false,
    });
    vi.mocked(apiClient.getMyReferrals).mockResolvedValue({
      code: 'MYCODE12',
      referrals: [],
      referred_by: null,
    });
    vi.mocked(apiClient.claimReferral).mockResolvedValue({
      referred_by: {
        id: 100,
        referrer_user_id: 42,
        referee_user_id: 5,
        referrer_credit_id: 1,
        referee_credit_id: 2,
        referrer_tier_at_claim: 'cercle',
        claimed_at: '2026-08-04T00:00:00Z',
      },
    });
    vi.mocked(apiClient.updateProfile).mockResolvedValue(undefined);

    render(<OnboardingPage />);

    await screen.findByPlaceholderText('ABCD1234');
    fireEvent.click(screen.getByText('Continue'));

    await waitFor(() => {
      expect(apiClient.claimReferral).toHaveBeenCalledWith('FRIEND12');
    });
    await waitFor(() => {
      expect(apiClient.updateProfile).toHaveBeenCalledWith(
        { referral_onboarding_seen: true },
        expect.anything(),
      );
    });
    expect(await screen.findByText('Welcome to TiP')).toBeTruthy();
  });
});
