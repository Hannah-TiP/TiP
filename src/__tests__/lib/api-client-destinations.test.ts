import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { apiClient } from '@/lib/api-client';

describe('apiClient.searchDestinations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls /api/destinations/search with query', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          { id: 1, type: 'country', name: { en: 'Japan' } },
          { id: 10, type: 'city', name: { en: 'Tokyo' }, country_name: { en: 'Japan' } },
        ],
      }),
    });

    const results = await apiClient.searchDestinations('Japan');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('/api/destinations/search?q=Japan');
    expect(results).toHaveLength(2);
    expect(results[0].type).toBe('country');
  });

  it('passes limit parameter', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    });

    await apiClient.searchDestinations('Tokyo', { limit: 5 });

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('limit=5');
  });
});

describe('apiClient.getHotels with ID-based filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends region_id param when provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    });

    await apiClient.getHotels({ region_id: 5 });

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('region_id=5');
  });

  it('sends country_id param when provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    });

    await apiClient.getHotels({ country_id: 3 });

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('country_id=3');
  });

  it('sends city_id param when provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    });

    await apiClient.getHotels({ city_id: 7 });

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('city_id=7');
  });

  it('does not include destination param', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    });

    await apiClient.getHotels({ star_rating: '5' });

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).not.toContain('destination');
  });
});
