import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/lib/api-client';
import type { QuoteWalletSummary, QuoteWithVersion } from '@/types/quote';

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

const sampleSummary: QuoteWalletSummary = {
  balance_points: 20000,
  available_points: 18000,
  cap_points: 2500,
  cap_rate: '0.05',
  max_applicable_points: 2500,
  applied_points: 0,
  currency: 'USD',
  applied_amount: '0.00',
  max_applicable_amount: '25.00',
};

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
      discounts: [{ label: 'Stay credit (2,500 P)', amount: '25.00', kind: 'stay_credit' }],
      total: '475.00',
    },
    applied_points: 2500,
    schema_version: 1,
  },
};

beforeEach(() => {
  mockFetch.mockReset();
});

describe('apiClient.getQuoteWalletSummary', () => {
  it('GETs /api/quotes/{id}/eligible-credits and unwraps the summary', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: sampleSummary }));

    const summary = await apiClient.getQuoteWalletSummary(42);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/quotes/42/eligible-credits',
      expect.objectContaining({ credentials: 'include' }),
    );
    expect(summary.balance_points).toBe(20000);
    expect(summary.max_applicable_points).toBe(2500);
    expect(summary.max_applicable_amount).toBe('25.00');
  });

  it('appends ?language= when a language is passed', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: sampleSummary }));
    await apiClient.getQuoteWalletSummary(42, 'kr');
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/quotes/42/eligible-credits?language=kr',
      expect.anything(),
    );
  });
});

describe('apiClient.applyQuotePoints', () => {
  it('POSTs /api/quotes/{id}/credits with the chosen points amount', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: sampleBundle }));
    const result = await apiClient.applyQuotePoints(42, 1000);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/quotes/42/credits',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ points: 1000 }) }),
    );
    expect(result.current_version?.applied_points).toBe(2500);
  });

  it('POSTs an empty body when no amount is given (default = max)', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: sampleBundle }));
    await apiClient.applyQuotePoints(42);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/quotes/42/credits',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({}) }),
    );
  });

  it('throws the backend message on a cap rejection (400)', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ message: 'You can apply up to 2,500 P to this booking.' }, 400),
    );
    await expect(apiClient.applyQuotePoints(42, 999999)).rejects.toThrow(/up to 2,500 P/);
  });
});

describe('apiClient.removeQuotePoints', () => {
  it('DELETEs /api/quotes/{id}/credits and unwraps `data`', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: sampleBundle }));
    await apiClient.removeQuotePoints(42);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/quotes/42/credits',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
