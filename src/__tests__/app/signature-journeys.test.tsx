/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-unused-vars */
import type { AnchorHTMLAttributes, ImgHTMLAttributes } from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SignatureJourneysPage from '@/app/signature-journeys/page';
import { apiClient } from '@/lib/api-client';
import en from '@/translations/en.json';
import type { SignatureJourney } from '@/types/signatureJourney';
import type { City } from '@/types/location';
import type { PaginatedResult } from '@/types/common';

function page<T>(items: T[]): PaginatedResult<T> {
  return { items, hasMore: false, total: items.length, page: 1 };
}

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
    getSignatureJourneys: vi.fn(),
    getCities: vi.fn(),
  },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const ritzYacht: SignatureJourney = {
  id: 4,
  slug: 'ritz-carlton-yacht',
  city_id: 10,
  status: 'published',
  title: { en: 'The Ritz-Carlton Yacht', kr: '리츠칼튼 요트' },
  cover_image: { original: 'https://example.com/yacht.jpg' },
  schema_version: 1,
};

const fsYacht: SignatureJourney = {
  ...ritzYacht,
  id: 5,
  slug: 'four-seasons-yachts',
  city_id: 20,
  title: { en: 'Four Seasons Yachts', kr: '포시즌스 요트' },
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
  it('fetches from the signature-journeys endpoint and renders cards with the gold pill', async () => {
    vi.mocked(apiClient.getSignatureJourneys).mockResolvedValue(page([ritzYacht, fsYacht]));
    vi.mocked(apiClient.getCities).mockResolvedValue([paris, rome]);

    render(<SignatureJourneysPage />);

    expect(
      await screen.findByRole('heading', { level: 1, name: /Signature Journeys/i }),
    ).toBeTruthy();

    await waitFor(() => {
      expect(vi.mocked(apiClient.getSignatureJourneys).mock.calls.length).toBe(1);
    });

    expect(await screen.findByText('The Ritz-Carlton Yacht')).toBeTruthy();
    expect(screen.getByText('Four Seasons Yachts')).toBeTruthy();

    const pills = screen.getAllByTestId('signature-journey-pill');
    expect(pills.length).toBe(2);
    expect(pills[0].className).toContain('bg-gold');
    expect(pills[0].textContent).toBe('SIGNATURE JOURNEY');
  });

  it('links each card to the /signature-journeys/[slug] detail route', async () => {
    vi.mocked(apiClient.getSignatureJourneys).mockResolvedValue(page([ritzYacht]));
    vi.mocked(apiClient.getCities).mockResolvedValue([paris]);

    render(<SignatureJourneysPage />);

    await screen.findByText('The Ritz-Carlton Yacht');

    const card = screen.getByTestId('signature-journey-card');
    expect(card.getAttribute('href')).toBe('/signature-journeys/ritz-carlton-yacht');
  });

  it('filters the grid by the selected destination city', async () => {
    vi.mocked(apiClient.getSignatureJourneys).mockResolvedValue(page([ritzYacht, fsYacht]));
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
    vi.mocked(apiClient.getSignatureJourneys).mockResolvedValue(page([ritzYacht]));
    vi.mocked(apiClient.getCities).mockResolvedValue([paris, rome]);

    render(<SignatureJourneysPage />);

    await screen.findByText('The Ritz-Carlton Yacht');

    screen.getByText('All destinations').click();
    const romeOption = await screen.findByRole('button', { name: 'Rome' });
    romeOption.click();

    expect(await screen.findByText(/No signature journeys for this destination yet/i)).toBeTruthy();
    expect(screen.queryByText('The Ritz-Carlton Yacht')).toBeNull();
  });

  it('renders the page-level empty state when there are no journeys at all', async () => {
    vi.mocked(apiClient.getSignatureJourneys).mockResolvedValue(page([]));
    vi.mocked(apiClient.getCities).mockResolvedValue([paris]);

    render(<SignatureJourneysPage />);

    expect(await screen.findByText(/No signature journeys available at the moment/i)).toBeTruthy();
  });
});
