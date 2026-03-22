/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-unused-vars */
import type { AnchorHTMLAttributes, ImgHTMLAttributes } from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
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
    getCities: vi.fn(),
    updateProfile: vi.fn(),
  },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('OnboardingPage', () => {
  it('renders localized city options on the location step', async () => {
    vi.mocked(apiClient.getProfile).mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      first_name: 'Ephie',
      last_name: 'Park',
      city_id: null,
      onboarding_completed: false,
      is_verified: true,
    });
    vi.mocked(apiClient.getCities).mockResolvedValue([
      {
        id: 1,
        region_id: 10,
        slug: 'seoul',
        status: true,
        name: { en: 'Seoul', kr: '서울' },
        link_services: true,
        schema_version: 1,
      },
    ]);

    render(<OnboardingPage />);

    expect(await screen.findByText('Where do you call home?')).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Seoul' })).toBeTruthy();
    });
  });
});
