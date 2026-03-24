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
    vi.mocked(apiClient.getProfile).mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      first_name: 'Ephie',
      last_name: 'Park',
      city_id: null,
      onboarding_completed: false,
      is_verified: true,
    });

    render(<OnboardingPage />);

    expect(await screen.findByText('Where do you call home?')).toBeTruthy();
    expect(screen.getByPlaceholderText('Search your city...')).toBeTruthy();
  });
});
