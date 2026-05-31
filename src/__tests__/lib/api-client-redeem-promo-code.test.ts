import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/lib/api-client';
import { RedeemPromoCodeError } from '@/types/stay-credit';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function mockResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  };
}

beforeEach(() => {
  mockFetch.mockReset();
  vi.stubGlobal('window', {
    dispatchEvent: vi.fn(),
  } as unknown as Window & typeof globalThis);
});

describe('apiClient.redeemPromoCode', () => {
  it('POSTs the code and returns the credited amount on success', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({
        code: 200,
        message: 'Success',
        data: { credited_amount: '150.00', currency: 'EUR', credit_id: 9 },
      }),
    );

    const result = await apiClient.redeemPromoCode('LOTTE-VIP');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/me/credits/redeem-code');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ code: 'LOTTE-VIP' });
    expect(result).toEqual({ credited_amount: '150.00', currency: 'EUR', credit_id: 9 });
  });

  it.each([
    [404, 4041, 'unknown'],
    [400, 4001, 'inactive'],
    [400, 4002, 'expired'],
    [400, 4003, 'max_reached'],
    [400, 4004, 'already_redeemed'],
  ])('maps backend %i/%i to error code "%s"', async (status, bodyCode, expected) => {
    mockFetch.mockResolvedValueOnce(mockResponse({ code: bodyCode, message: 'nope' }, status));

    await expect(apiClient.redeemPromoCode('X')).rejects.toMatchObject({
      code: expected,
    });
  });

  it('falls back to a generic error code for an unmapped failure', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ code: 9999, message: 'boom' }, 400));

    const err = await apiClient.redeemPromoCode('X').catch((e) => e);
    expect(err).toBeInstanceOf(RedeemPromoCodeError);
    expect(err.code).toBe('generic');
  });
});
