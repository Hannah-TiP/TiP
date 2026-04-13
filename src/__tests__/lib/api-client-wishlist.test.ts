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

describe('ApiClient wishlist methods', () => {
  it('getWishlist calls GET /api/wishlist', async () => {
    const mockData = [{ hotel: { id: 10 } }];
    mockFetch.mockResolvedValueOnce(mockResponse({ data: mockData }));

    const result = await apiClient.getWishlist();

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/wishlist',
      expect.objectContaining({ credentials: 'include' }),
    );
    expect(result).toEqual(mockData);
  });

  it('getWishlistIds calls GET /api/wishlist/ids', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: [1, 5, 10] }));

    const result = await apiClient.getWishlistIds();

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/wishlist/ids',
      expect.objectContaining({ credentials: 'include' }),
    );
    expect(result).toEqual([1, 5, 10]);
  });

  it('addToWishlist calls POST /api/wishlist with hotel_id', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: { hotel_id: 5 } }));

    await apiClient.addToWishlist(5);

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/wishlist',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ hotel_id: 5 }),
      }),
    );
  });

  it('removeFromWishlist calls DELETE /api/wishlist/:id', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: null }));

    await apiClient.removeFromWishlist(42);

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/wishlist/42',
      expect.objectContaining({
        method: 'DELETE',
      }),
    );
  });
});
