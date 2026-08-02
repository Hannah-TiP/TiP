import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/lib/api-client';
import type { City } from '@/types/location';

/**
 * SMA-247: both destination lists are sourced from published-content-derived
 * endpoints rather than the global (~84k row) city catalog.
 */

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

/** A city that would never appear in the first 100 rows of the city catalog. */
const farCatalogCity: City = {
  id: 84231,
  name: { en: 'Ushuaia', kr: '우수아이아' },
  slug: 'ushuaia',
  region_id: 900,
  status: true,
  link_services: true,
  schema_version: 1,
};

beforeEach(() => {
  mockFetch.mockReset();
});

describe('apiClient.getSignatureJourneyDestinations', () => {
  it('hits the /signature-journeys/destinations proxy with the language param', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: [farCatalogCity] }));

    await apiClient.getSignatureJourneyDestinations('kr');

    expect(mockFetch.mock.calls[0][0]).toBe('/api/signature-journeys/destinations?language=kr');
  });

  it('defaults the language to en', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: [] }));

    await apiClient.getSignatureJourneyDestinations();

    expect(mockFetch.mock.calls[0][0]).toBe('/api/signature-journeys/destinations?language=en');
  });

  it('unwraps the envelope into a City[] including far-catalog cities', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: [farCatalogCity] }));

    const result = await apiClient.getSignatureJourneyDestinations('en');

    expect(result).toEqual([farCatalogCity]);
  });

  it('throws with the backend message on failure', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ message: 'Internal server error' }, 500));

    await expect(apiClient.getSignatureJourneyDestinations('en')).rejects.toThrow(
      'Internal server error',
    );
  });
});

describe('apiClient.getExperienceDestinations', () => {
  it('hits the /destinations/experiences proxy with the language param', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: [farCatalogCity] }));

    await apiClient.getExperienceDestinations('kr');

    expect(mockFetch.mock.calls[0][0]).toBe('/api/destinations/experiences?language=kr');
  });

  it('defaults the language to en', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: [] }));

    await apiClient.getExperienceDestinations();

    expect(mockFetch.mock.calls[0][0]).toBe('/api/destinations/experiences?language=en');
  });

  it('unwraps the envelope into a City[]', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: [farCatalogCity] }));

    const result = await apiClient.getExperienceDestinations('en');

    expect(result).toEqual([farCatalogCity]);
  });

  it('throws with the backend message on failure', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ message: 'Failed to fetch experience destinations' }, 502),
    );

    await expect(apiClient.getExperienceDestinations('en')).rejects.toThrow(
      'Failed to fetch experience destinations',
    );
  });
});
