/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-unused-vars */
import type { AnchorHTMLAttributes, ImgHTMLAttributes } from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MoreDreamsPage from '@/app/more-dreams/page';
import { apiClient } from '@/lib/api-client';
import type { Activity } from '@/types/activity';
import type { Restaurant } from '@/types/restaurant';
import type { City } from '@/types/location';

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

vi.mock('next/image', () => ({
  default: ({
    fill: _fill,
    priority: _priority,
    sizes: _sizes,
    ...props
  }: ImgHTMLAttributes<HTMLImageElement> & {
    fill?: boolean;
    priority?: boolean;
    sizes?: string;
  }) => <img {...props} alt={props.alt} />,
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

vi.mock('@/components/Footer', () => ({
  default: () => <div>Footer</div>,
}));

vi.mock('@/components/PreviewBanner', () => ({
  default: () => null,
}));

vi.mock('@/hooks/usePreviewMode', () => ({
  usePreviewMode: () => ({ isPreview: false, isAllowed: false, toggle: () => {} }),
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    getActivities: vi.fn(),
    getRestaurants: vi.fn(),
    getCities: vi.fn(),
  },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const localExperience: Activity = {
  id: 1,
  slug: 'paris-private-boat',
  city_id: 10,
  category: 'sightseeing',
  kind: 'local_experience',
  status: 'published',
  name: { en: 'Paris Private Boat Tour', kr: '파리 프라이빗 보트 투어' },
  images: [{ original: 'https://example.com/boat.jpg' }],
  schema_version: 1,
};

const signatureJourney: Activity = {
  id: 4,
  slug: 'ritz-carlton-yacht',
  city_id: 10,
  category: 'culture',
  kind: 'package',
  status: 'published',
  name: { en: 'The Ritz-Carlton Yacht', kr: '리츠칼튼 요트' },
  images: [{ original: 'https://example.com/yacht.jpg' }],
  schema_version: 1,
};

const restaurant: Restaurant = {
  id: 1,
  slug: 'noma',
  city_id: 10,
  status: 'published',
  name: { en: 'Noma', kr: '노마' },
  images: [{ original: 'https://example.com/noma.jpg' }],
  schema_version: 1,
};

const paris: City = {
  id: 10,
  name: { en: 'Paris', kr: '파리' },
  slug: 'paris',
  region_id: 1,
  status: true,
  link_services: true,
  schema_version: 1,
};

describe('MoreDreamsPage — sections split', () => {
  it('renders both activity-section titles + restaurants when all three have data', async () => {
    vi.mocked(apiClient.getActivities).mockImplementation(async (params) => {
      if (params?.kind === 'package') return [signatureJourney];
      return [localExperience];
    });
    vi.mocked(apiClient.getRestaurants).mockResolvedValue([restaurant]);
    vi.mocked(apiClient.getCities).mockResolvedValue([paris]);

    render(<MoreDreamsPage />);

    expect(
      await screen.findByRole('heading', { level: 2, name: /Activities & Experiences/i }),
    ).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: /^Signature Journeys$/i })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: /Curated Restaurants/i })).toBeTruthy();
  });

  it('calls getActivities twice — once per kind', async () => {
    vi.mocked(apiClient.getActivities).mockImplementation(async (params) => {
      if (params?.kind === 'package') return [signatureJourney];
      return [localExperience];
    });
    vi.mocked(apiClient.getRestaurants).mockResolvedValue([]);
    vi.mocked(apiClient.getCities).mockResolvedValue([paris]);

    render(<MoreDreamsPage />);

    await waitFor(() => {
      expect(vi.mocked(apiClient.getActivities).mock.calls.length).toBe(2);
    });

    const callKinds = vi
      .mocked(apiClient.getActivities)
      .mock.calls.map((call) => call[0]?.kind)
      .sort();
    expect(callKinds).toEqual(['local_experience', 'package']);
  });

  it('hides Signature Journeys section when its API call returns empty', async () => {
    vi.mocked(apiClient.getActivities).mockImplementation(async (params) => {
      if (params?.kind === 'package') return [];
      return [localExperience];
    });
    vi.mocked(apiClient.getRestaurants).mockResolvedValue([]);
    vi.mocked(apiClient.getCities).mockResolvedValue([paris]);

    render(<MoreDreamsPage />);

    // Wait for the Activities section to appear first
    expect(
      await screen.findByRole('heading', { level: 2, name: /Activities & Experiences/i }),
    ).toBeTruthy();

    // Signature Journeys heading should not render (section is hidden when empty)
    expect(screen.queryByRole('heading', { level: 2, name: /^Signature Journeys$/i })).toBeNull();
  });

  it('hides Activities & Experiences section when its API call returns empty', async () => {
    vi.mocked(apiClient.getActivities).mockImplementation(async (params) => {
      if (params?.kind === 'package') return [signatureJourney];
      return [];
    });
    vi.mocked(apiClient.getRestaurants).mockResolvedValue([]);
    vi.mocked(apiClient.getCities).mockResolvedValue([paris]);

    render(<MoreDreamsPage />);

    expect(
      await screen.findByRole('heading', { level: 2, name: /^Signature Journeys$/i }),
    ).toBeTruthy();
    expect(
      screen.queryByRole('heading', { level: 2, name: /Activities & Experiences/i }),
    ).toBeNull();
  });

  it('renders package cards with the gold accent variant pill', async () => {
    vi.mocked(apiClient.getActivities).mockImplementation(async (params) => {
      if (params?.kind === 'package') return [signatureJourney];
      return [localExperience];
    });
    vi.mocked(apiClient.getRestaurants).mockResolvedValue([]);
    vi.mocked(apiClient.getCities).mockResolvedValue([paris]);

    render(<MoreDreamsPage />);

    await screen.findByRole('heading', { level: 2, name: /^Signature Journeys$/i });

    const signaturePill = screen.getByTestId('activity-pill-signature');
    expect(signaturePill).toBeTruthy();
    // Gold accent — bg-gold class — is what distinguishes package cards.
    expect(signaturePill.className).toContain('bg-gold');
    expect(signaturePill.textContent).toBe('SIGNATURE JOURNEY');

    const standardPill = screen.getByTestId('activity-pill-standard');
    expect(standardPill).toBeTruthy();
    // Standard cards keep the neutral white pill — no gold accent.
    expect(standardPill.className).not.toContain('bg-gold');
    expect(standardPill.className).toContain('bg-white/90');
  });

  it('treats activities with missing kind as local_experience (defensive)', async () => {
    const noKindActivity: Activity = {
      ...localExperience,
      id: 99,
      slug: 'no-kind',
      kind: null,
      name: { en: 'No Kind Activity', kr: '' },
    };
    // Simulate backend response that put a kindless item in the local_experience bucket.
    vi.mocked(apiClient.getActivities).mockImplementation(async (params) => {
      if (params?.kind === 'package') return [];
      return [noKindActivity];
    });
    vi.mocked(apiClient.getRestaurants).mockResolvedValue([]);
    vi.mocked(apiClient.getCities).mockResolvedValue([paris]);

    render(<MoreDreamsPage />);

    expect(
      await screen.findByRole('heading', { level: 2, name: /Activities & Experiences/i }),
    ).toBeTruthy();
    // The kindless activity renders under Activities & Experiences.
    expect(screen.getByText('No Kind Activity')).toBeTruthy();
  });
});
