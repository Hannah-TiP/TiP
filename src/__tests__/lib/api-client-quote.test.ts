import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/lib/api-client';
import type { QuoteWithVersion } from '@/types/quote';

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

describe('apiClient.getQuote', () => {
  it('GETs /api/quotes/{id} and unwraps `data`', async () => {
    const bundle: QuoteWithVersion = {
      quote: {
        id: 42,
        trip_id: 7,
        trip_version_id: 3,
        user_id: 11,
        current_quote_version_id: 99,
        status: 'SENT',
        sent_at: '2026-04-28T10:00:00Z',
        schema_version: 1,
      },
      current_version: {
        id: 99,
        quote_id: 42,
        version_number: 1,
        line_items: [
          {
            day_index: 0,
            item_index: 0,
            label: 'Hotel — Ritz',
            amount: '1500.00',
            currency: 'USD',
            quantity: 2,
          },
        ],
        total_snapshot: {
          currency: 'USD',
          subtotal: '3000.00',
          fees: [],
          discounts: [],
          total: '3000.00',
        },
        schema_version: 1,
      },
    };
    mockFetch.mockResolvedValueOnce(mockResponse({ data: bundle }));

    const result = await apiClient.getQuote(42);

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/quotes/42',
      expect.objectContaining({
        credentials: 'include',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }),
    );
    expect(result).toEqual(bundle);
  });

  it('throws backend error message on non-OK response', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ message: 'Quote not found' }, 404));
    await expect(apiClient.getQuote(123)).rejects.toThrow('Quote not found');
  });

  it('dispatches auth:unauthorized on 401', async () => {
    const handler = vi.fn();
    window.addEventListener('auth:unauthorized', handler);
    mockFetch.mockResolvedValueOnce(mockResponse({ message: 'Unauthorized' }, 401));

    await expect(apiClient.getQuote(1)).rejects.toThrow();
    expect(handler).toHaveBeenCalled();
    window.removeEventListener('auth:unauthorized', handler);
  });
});
