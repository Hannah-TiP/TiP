import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/lib/api-client';
import type { SignatureJourney } from '@/types/signatureJourney';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function mockResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  };
}

function paginated<T>(items: T[]) {
  return mockResponse({
    data: {
      items,
      total: items.length,
      per_page: 12,
      current_page: 1,
      last_page: 1,
      has_more: false,
    },
  });
}

const journey: SignatureJourney = {
  id: 1,
  slug: 'ritz-carlton-yacht',
  city_id: 10,
  status: 'published',
  title: { en: 'The Ritz-Carlton Yacht', kr: '리츠칼튼 요트' },
  schema_version: 1,
};

beforeEach(() => {
  mockFetch.mockReset();
});

describe('apiClient.getSignatureJourneys', () => {
  it('hits the /signature-journeys proxy endpoint', async () => {
    mockFetch.mockResolvedValueOnce(paginated([]));
    await apiClient.getSignatureJourneys();

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toBe('/api/signature-journeys');
  });

  it('forwards city_id, language, page and per_page as query params', async () => {
    mockFetch.mockResolvedValueOnce(paginated([]));
    await apiClient.getSignatureJourneys({
      city_id: 7,
      language: 'kr',
      page: 2,
      per_page: 100,
    });

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('city_id=7');
    expect(url).toContain('language=kr');
    expect(url).toContain('page=2');
    expect(url).toContain('per_page=100');
  });

  it('maps the envelope into a PaginatedResult of journeys', async () => {
    mockFetch.mockResolvedValueOnce(paginated([journey]));

    const result = await apiClient.getSignatureJourneys({ language: 'en' });
    expect(result.items).toEqual([journey]);
    expect(result.hasMore).toBe(false);
    expect(result.total).toBe(1);
  });
});

describe('apiClient.getSignatureJourneyBySlug', () => {
  it('requests the slug endpoint with the language query param and unwraps data', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: journey }));

    const result = await apiClient.getSignatureJourneyBySlug('ritz-carlton-yacht', 'kr');

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toBe('/api/signature-journeys/ritz-carlton-yacht?language=kr');
    expect(result).toEqual(journey);
  });

  it('omits the language query when none is given', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: journey }));

    await apiClient.getSignatureJourneyBySlug('ritz-carlton-yacht');

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toBe('/api/signature-journeys/ritz-carlton-yacht');
  });

  it('throws with the backend message on a 404', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ message: 'Signature journey not found' }, 404));

    await expect(apiClient.getSignatureJourneyBySlug('nope')).rejects.toThrow(
      'Signature journey not found',
    );
  });
});
