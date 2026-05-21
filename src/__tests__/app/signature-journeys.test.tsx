/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-unused-vars */
import type { AnchorHTMLAttributes, ImgHTMLAttributes } from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SignatureJourneysPage from '@/app/signature-journeys/page';
import { apiClient } from '@/lib/api-client';
import en from '@/translations/en.json';
import type { Activity } from '@/types/activity';
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

// `t()` resolves to the real English copy so headings are assertable.
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    lang: 'en' as const,
    setLang: vi.fn(),
    t: (key: string) => (en as Record<string, string>)[key] ?? key,
  }),
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    getActivities: vi.fn(),
    getCities: vi.fn(),
  },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const ritzYacht: Activity = {
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

const fsYacht: Activity = {
  ...ritzYacht,
  id: 5,
  slug: 'four-seasons-yachts',
  city_id: 20,
  name: { en: 'Four Seasons Yachts', kr: '포시즌스 요트' },
};

const localExperience: Activity = {
  id: 1,
  slug: 'paris-private-boat',
  city_id: 10,
  category: 'sightseeing',
  kind: 'local_experience',
  status: 'published',
  name: { en: 'Paris Private Boat Tour', kr: '파리 보트' },
  images: [{ original: 'https://example.com/boat.jpg' }],
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

const rome: City = {
  ...paris,
  id: 20,
  name: { en: 'Rome', kr: '로마' },
  slug: 'rome',
};

describe('SignatureJourneysPage', () => {
  it('fetches only kind=package and renders the package cards with the gold pill', async () => {
    vi.mocked(apiClient.getActivities).mockResolvedValue([ritzYacht, fsYacht]);
    vi.mocked(apiClient.getCities).mockResolvedValue([paris, rome]);

    render(<SignatureJourneysPage />);

    expect(
      await screen.findByRole('heading', { level: 1, name: /Signature Journeys/i }),
    ).toBeTruthy();

    await waitFor(() => {
      expect(vi.mocked(apiClient.getActivities).mock.calls.length).toBe(1);
    });
    expect(vi.mocked(apiClient.getActivities).mock.calls[0]?.[0]?.kind).toBe('package');

    // findByText waits for the async getActivities() data to render — the
    // mock call resolving above does not guarantee React has re-rendered
    // the cards yet, which made the synchronous getByText flaky under CI load.
    expect(await screen.findByText('The Ritz-Carlton Yacht')).toBeTruthy();
    expect(screen.getByText('Four Seasons Yachts')).toBeTruthy();

    // All cards use the signature (gold) variant pill.
    const pills = screen.getAllByTestId('activity-pill-signature');
    expect(pills.length).toBe(2);
    expect(pills[0].className).toContain('bg-gold');
    expect(pills[0].textContent).toBe('SIGNATURE JOURNEY');
    expect(screen.queryByTestId('activity-pill-standard')).toBeNull();
  });

  it('drops any non-package items that leak into the response', async () => {
    vi.mocked(apiClient.getActivities).mockResolvedValue([ritzYacht, localExperience]);
    vi.mocked(apiClient.getCities).mockResolvedValue([paris]);

    render(<SignatureJourneysPage />);

    // findByRole above only waits for the static page heading, which renders
    // before getActivities() resolves — findByText waits for the actual card.
    await screen.findByRole('heading', { level: 1, name: /Signature Journeys/i });

    expect(await screen.findByText('The Ritz-Carlton Yacht')).toBeTruthy();
    expect(screen.queryByText('Paris Private Boat Tour')).toBeNull();
  });

  it('filters the grid by the selected destination city', async () => {
    vi.mocked(apiClient.getActivities).mockResolvedValue([ritzYacht, fsYacht]);
    vi.mocked(apiClient.getCities).mockResolvedValue([paris, rome]);

    render(<SignatureJourneysPage />);

    await screen.findByText('The Ritz-Carlton Yacht');
    expect(screen.getByText('Four Seasons Yachts')).toBeTruthy();

    // Open the destination dropdown and pick Paris.
    screen.getByText('All destinations').click();
    const parisOption = await screen.findByRole('button', { name: 'Paris' });
    parisOption.click();

    await waitFor(() => {
      // Rome-only journey is filtered out; Paris journey remains.
      expect(screen.queryByText('Four Seasons Yachts')).toBeNull();
    });
    expect(screen.getByText('The Ritz-Carlton Yacht')).toBeTruthy();
    expect(screen.getByText(/Showing 1 signature journeys in Paris/i)).toBeTruthy();
  });

  it('shows an empty state when the selected city has no journeys', async () => {
    vi.mocked(apiClient.getActivities).mockResolvedValue([ritzYacht]);
    vi.mocked(apiClient.getCities).mockResolvedValue([paris, rome]);

    render(<SignatureJourneysPage />);

    await screen.findByText('The Ritz-Carlton Yacht');

    screen.getByText('All destinations').click();
    const romeOption = await screen.findByRole('button', { name: 'Rome' });
    romeOption.click();

    expect(await screen.findByText(/No signature journeys for this destination yet/i)).toBeTruthy();
    expect(screen.queryByText('The Ritz-Carlton Yacht')).toBeNull();
  });

  it('renders the page-level empty state when there are no packages at all', async () => {
    vi.mocked(apiClient.getActivities).mockResolvedValue([]);
    vi.mocked(apiClient.getCities).mockResolvedValue([paris]);

    render(<SignatureJourneysPage />);

    expect(await screen.findByText(/No signature journeys available at the moment/i)).toBeTruthy();
  });
});
