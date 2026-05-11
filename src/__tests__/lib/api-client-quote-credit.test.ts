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

const sampleBundle: QuoteWithVersion = {
  quote: {
    id: 42,
    trip_id: 7,
    trip_version_id: 3,
    user_id: 11,
    current_quote_version_id: 100,
    status: 'SENT',
    schema_version: 1,
  },
  current_version: {
    id: 100,
    quote_id: 42,
    version_number: 2,
    line_items: [],
    total_snapshot: {
      currency: 'USD',
      subtotal: '500.00',
      fees: [],
      discounts: [{ label: 'Stay credit (welcome, USD 150)', amount: '150.00' }],
      total: '350.00',
    },
    applied_stay_credit_ids: [9],
    schema_version: 1,
  },
};

beforeEach(() => {
  mockFetch.mockReset();
});

describe('apiClient.listEligibleCreditsForQuote', () => {
  it('GETs /api/quotes/{id}/eligible-credits and unwraps `data`', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({
        data: [
          {
            id: 9,
            user_id: 11,
            source: 'welcome',
            status: 'issued',
            amount_cents: 50000,
            currency: 'USD',
            schema_version: 1,
            converted_amount: '500.00',
            converted_currency: 'USD',
          },
        ],
      }),
    );

    const rows = await apiClient.listEligibleCreditsForQuote(42);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/quotes/42/eligible-credits',
      expect.objectContaining({ credentials: 'include' }),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(9);
    expect(rows[0].converted_amount).toBe('500.00');
  });

  it('returns [] when the backend payload is empty', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: [] }));
    const rows = await apiClient.listEligibleCreditsForQuote(42);
    expect(rows).toEqual([]);
  });
});

describe('apiClient.applyQuoteCredit', () => {
  it('POSTs /api/quotes/{id}/credits/{credit_id} and unwraps `data`', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: sampleBundle }));
    const result = await apiClient.applyQuoteCredit(42, 9);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/quotes/42/credits/9',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(result.current_version?.applied_stay_credit_ids).toEqual([9]);
  });

  it('throws backend error on stacking rejection (400)', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ message: 'A credit is already applied to this quote' }, 400),
    );
    await expect(apiClient.applyQuoteCredit(42, 10)).rejects.toThrow(/already applied/i);
  });
});

describe('apiClient.removeQuoteCredit', () => {
  it('DELETEs /api/quotes/{id}/credits/{credit_id} and unwraps `data`', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: sampleBundle }));
    await apiClient.removeQuoteCredit(42, 9);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/quotes/42/credits/9',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
