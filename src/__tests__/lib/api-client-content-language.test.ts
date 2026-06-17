import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/lib/api-client';

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

beforeEach(() => {
  mockFetch.mockReset();
});

function url(): string {
  return mockFetch.mock.calls[0][0] as string;
}

describe('apiClient content detail fetches thread the active language (SMA-139)', () => {
  it('getHotelBySlug appends ?language= when a language is passed', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: {} }));
    await apiClient.getHotelBySlug('aman-tokyo', 'kr');
    expect(url()).toBe('/api/hotels/aman-tokyo?language=kr');
  });

  it('getHotelBySlug omits the param when no language is passed', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: {} }));
    await apiClient.getHotelBySlug('aman-tokyo');
    expect(url()).toBe('/api/hotels/aman-tokyo');
  });

  it('getHotelById appends ?language=', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: {} }));
    await apiClient.getHotelById(42, 'kr');
    expect(url()).toBe('/api/hotels/by-id/42?language=kr');
  });

  it('getActivityBySlug appends ?language=', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: {} }));
    await apiClient.getActivityBySlug('private-jet', 'kr');
    expect(url()).toBe('/api/activities/private-jet?language=kr');
  });

  it('getActivityById appends ?language=', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: {} }));
    await apiClient.getActivityById(7, 'en');
    expect(url()).toBe('/api/activities/by-id/7?language=en');
  });

  it('getRestaurantBySlug appends ?language=', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: {} }));
    await apiClient.getRestaurantBySlug('le-jules-verne', 'kr');
    expect(url()).toBe('/api/restaurants/le-jules-verne?language=kr');
  });

  it('getRestaurantById appends ?language=', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: {} }));
    await apiClient.getRestaurantById(9, 'kr');
    expect(url()).toBe('/api/restaurants/by-id/9?language=kr');
  });

  it('getCityById appends ?language= when passed, omits otherwise', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: {} }));
    await apiClient.getCityById(3, 'kr');
    expect(url()).toBe('/api/cities/3?language=kr');

    mockFetch.mockReset();
    mockFetch.mockResolvedValueOnce(mockResponse({ data: {} }));
    await apiClient.getCityById(3);
    expect(url()).toBe('/api/cities/3');
  });

  it('getWishlist appends ?language= when passed, omits otherwise', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: [] }));
    await apiClient.getWishlist('kr');
    expect(url()).toBe('/api/wishlist?language=kr');

    mockFetch.mockReset();
    mockFetch.mockResolvedValueOnce(mockResponse({ data: [] }));
    await apiClient.getWishlist();
    expect(url()).toBe('/api/wishlist');
  });

  it('getCities forwards the active language', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: [] }));
    await apiClient.getCities('kr');
    expect(url()).toBe('/api/cities?language=kr');
  });

  it('searchCities forwards the active language', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: [] }));
    await apiClient.searchCities('par', 'kr');
    expect(url()).toContain('language=kr');
    expect(url()).toContain('q=par');
  });
});
