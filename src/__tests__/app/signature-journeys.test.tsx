/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-unused-vars */
import type { AnchorHTMLAttributes, ImgHTMLAttributes } from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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

/** A city with zero journeys — must never be offered as a suggestion. */
const oslo: City = {
  ...paris,
  id: 30,
  name: { en: 'Oslo', kr: '오슬로' },
  slug: 'oslo',
};

/**
 * Wire the journeys endpoint: the unfiltered load returns everything, a `q`
 * search returns whatever `bySearch` resolves for the typed text.
 */
function mockJourneys(
  all: SignatureJourney[],
  bySearch: (q: string) => SignatureJourney[] = () => all,
) {
  vi.mocked(apiClient.getSignatureJourneys).mockImplementation(async (params) =>
    page(params?.q ? bySearch(params.q) : all),
  );
}

function suggestionsPanel() {
  return within(screen.getByTestId('signature-journey-suggestions'));
}

function gridTitles(): string[] {
  const grid = screen.queryByTestId('section-signature-journeys');
  if (!grid) return [];
  return within(grid)
    .getAllByTestId('signature-journey-card')
    .map((card) => card.textContent ?? '');
}

describe('SignatureJourneysPage', () => {
  it('fetches from the signature-journeys endpoint and renders cards with the gold pill', async () => {
    mockJourneys([ritzYacht, fsYacht]);
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
    mockJourneys([ritzYacht]);
    vi.mocked(apiClient.getCities).mockResolvedValue([paris]);

    render(<SignatureJourneysPage />);

    await screen.findByText('The Ritz-Carlton Yacht');

    const card = screen.getByTestId('signature-journey-card');
    expect(card.getAttribute('href')).toBe('/signature-journeys/ritz-carlton-yacht');
  });

  it('renders grouped city and journey suggestions, offering only related cities', async () => {
    mockJourneys([ritzYacht, fsYacht]);
    vi.mocked(apiClient.getCities).mockResolvedValue([paris, rome, oslo]);

    render(<SignatureJourneysPage />);
    await screen.findByText('The Ritz-Carlton Yacht');

    fireEvent.focus(screen.getByTestId('signature-journey-search'));

    const panel = suggestionsPanel();
    expect(panel.getByText('Destinations')).toBeTruthy();
    expect(panel.getByText('Journeys')).toBeTruthy();

    const cityNames = panel.getAllByTestId('suggestion-city').map((b) => b.textContent);
    expect(cityNames).toEqual(['Paris', 'Rome']);
    // Oslo has no journey — it is never offered.
    expect(panel.queryByText('Oslo')).toBeNull();

    const journeyNames = panel.getAllByTestId('suggestion-journey').map((b) => b.textContent);
    expect(journeyNames[0]).toContain('The Ritz-Carlton Yacht');
    expect(journeyNames[1]).toContain('Four Seasons Yachts');
  });

  it('narrows the suggestions to the server results for the typed text', async () => {
    mockJourneys([ritzYacht, fsYacht], (q) =>
      q.toLowerCase().includes('ritz') ? [ritzYacht] : [ritzYacht, fsYacht],
    );
    vi.mocked(apiClient.getCities).mockResolvedValue([paris, rome]);

    render(<SignatureJourneysPage />);
    await screen.findByText('The Ritz-Carlton Yacht');

    fireEvent.change(screen.getByTestId('signature-journey-search'), {
      target: { value: 'ritz' },
    });

    await waitFor(() => {
      expect(gridTitles()).toHaveLength(1);
    });
    expect(gridTitles()[0]).toContain('The Ritz-Carlton Yacht');

    const panel = suggestionsPanel();
    expect(panel.getAllByTestId('suggestion-city').map((b) => b.textContent)).toEqual(['Paris']);
    expect(panel.getAllByTestId('suggestion-journey')).toHaveLength(1);
  });

  it('filters the grid to the picked city suggestion', async () => {
    mockJourneys([ritzYacht, fsYacht]);
    vi.mocked(apiClient.getCities).mockResolvedValue([paris, rome]);

    render(<SignatureJourneysPage />);
    await screen.findByText('The Ritz-Carlton Yacht');

    fireEvent.focus(screen.getByTestId('signature-journey-search'));
    fireEvent.click(suggestionsPanel().getByRole('button', { name: 'Paris' }));

    await waitFor(() => {
      expect(gridTitles()).toHaveLength(1);
    });
    expect(gridTitles()[0]).toContain('The Ritz-Carlton Yacht');
    expect(screen.getByText(/Showing 1 signature journeys in Paris/i)).toBeTruthy();
  });

  it('surfaces a single journey when a journey suggestion is picked', async () => {
    mockJourneys([ritzYacht, fsYacht]);
    vi.mocked(apiClient.getCities).mockResolvedValue([paris, rome]);

    render(<SignatureJourneysPage />);
    await screen.findByText('The Ritz-Carlton Yacht');

    fireEvent.focus(screen.getByTestId('signature-journey-search'));
    const journeyOptions = suggestionsPanel().getAllByTestId('suggestion-journey');
    fireEvent.click(journeyOptions[1]);

    await waitFor(() => {
      expect(gridTitles()).toHaveLength(1);
    });
    expect(gridTitles()[0]).toContain('Four Seasons Yachts');
    expect((screen.getByTestId('signature-journey-search') as HTMLInputElement).value).toBe(
      'Four Seasons Yachts',
    );
  });

  it('shows the empty state when a search matches nothing and restores the grid on clear', async () => {
    mockJourneys([ritzYacht, fsYacht], () => []);
    vi.mocked(apiClient.getCities).mockResolvedValue([paris, rome]);

    render(<SignatureJourneysPage />);
    await screen.findByText('The Ritz-Carlton Yacht');

    fireEvent.change(screen.getByTestId('signature-journey-search'), {
      target: { value: 'zzzz' },
    });

    const emptyState = await screen.findByTestId('signature-journeys-empty');
    expect(within(emptyState).getByText(/No signature journeys match your search/i)).toBeTruthy();
    expect(gridTitles()).toEqual([]);

    fireEvent.click(screen.getByTestId('signature-journey-clear'));

    await waitFor(() => {
      expect(gridTitles()).toHaveLength(2);
    });
    expect(screen.queryByTestId('signature-journeys-empty')).toBeNull();
  });

  it('discards an out-of-order search response', async () => {
    let resolveFirst: ((value: PaginatedResult<SignatureJourney>) => void) | undefined;
    const firstResponse = new Promise<PaginatedResult<SignatureJourney>>((resolve) => {
      resolveFirst = resolve;
    });

    vi.mocked(apiClient.getSignatureJourneys).mockImplementation(async (params) => {
      if (!params?.q) return page([ritzYacht, fsYacht]);
      if (params.q === 'ritz') return firstResponse;
      return page([fsYacht]);
    });
    vi.mocked(apiClient.getCities).mockResolvedValue([paris, rome]);

    render(<SignatureJourneysPage />);
    await screen.findByText('The Ritz-Carlton Yacht');

    const input = screen.getByTestId('signature-journey-search');
    fireEvent.change(input, { target: { value: 'ritz' } });
    await waitFor(() => {
      expect(
        vi
          .mocked(apiClient.getSignatureJourneys)
          .mock.calls.some(([params]) => params?.q === 'ritz'),
      ).toBe(true);
    });

    fireEvent.change(input, { target: { value: 'four' } });
    await waitFor(() => {
      expect(gridTitles()).toHaveLength(1);
    });
    expect(gridTitles()[0]).toContain('Four Seasons Yachts');

    // The stale "ritz" response lands late and must be ignored.
    resolveFirst?.(page([ritzYacht]));
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(gridTitles()[0]).toContain('Four Seasons Yachts');
  });

  it('renders the page-level empty state when there are no journeys at all', async () => {
    mockJourneys([]);
    vi.mocked(apiClient.getCities).mockResolvedValue([paris]);

    render(<SignatureJourneysPage />);

    expect(await screen.findByText(/No signature journeys available at the moment/i)).toBeTruthy();
  });
});
