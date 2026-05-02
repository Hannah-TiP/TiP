import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/lib/api-client';
import type { CheckoutSessionResponse, WidgetConfig } from '@/types/payment';

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

describe('apiClient.createCheckoutSession', () => {
  it('POSTs /api/quotes/{id}/checkout-session and unwraps `data`', async () => {
    const payload: CheckoutSessionResponse = {
      checkout_url: 'https://checkout.demo.flywire.com/foo?bar=baz',
      payment_id: 77,
    };
    mockFetch.mockResolvedValueOnce(mockResponse({ data: payload }));

    const result = await apiClient.createCheckoutSession(42);

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/quotes/42/checkout-session',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }),
    );
    expect(result).toEqual(payload);
  });

  it('throws backend error message on non-OK response', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ message: 'Quote must be in SENT status to start checkout' }, 400),
    );

    await expect(apiClient.createCheckoutSession(11)).rejects.toThrow(/must be in SENT status/i);
  });

  it('dispatches auth:unauthorized on 401', async () => {
    const handler = vi.fn();
    window.addEventListener('auth:unauthorized', handler);
    mockFetch.mockResolvedValueOnce(mockResponse({ message: 'Unauthorized' }, 401));

    await expect(apiClient.createCheckoutSession(1)).rejects.toThrow();
    expect(handler).toHaveBeenCalled();
    window.removeEventListener('auth:unauthorized', handler);
  });
});

describe('apiClient.getWidgetConfig', () => {
  it('GETs /api/payments/{id}/widget-config and unwraps `data`', async () => {
    const cfg: WidgetConfig = {
      portal_code: 'TIP',
      amount: '1234.56',
      currency: 'USD',
      callback_url: 'https://api.example.com/api/v2/webhooks/flywire',
      callback_id: '99',
      callback_version: '2',
      return_url: 'https://www.example.com/quotes/42?paid=1',
      cancel_url: 'https://www.example.com/quotes/42?cancelled=1',
      booking_reference: '99',
    };
    mockFetch.mockResolvedValueOnce(mockResponse({ data: cfg }));

    const result = await apiClient.getWidgetConfig(99);

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/payments/99/widget-config',
      expect.objectContaining({
        credentials: 'include',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }),
    );
    expect(result).toEqual(cfg);
  });

  it('throws on non-OK response', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ message: 'Payment not found' }, 404));
    await expect(apiClient.getWidgetConfig(123)).rejects.toThrow('Payment not found');
  });

  it('dispatches auth:unauthorized on 401', async () => {
    const handler = vi.fn();
    window.addEventListener('auth:unauthorized', handler);
    mockFetch.mockResolvedValueOnce(mockResponse({ message: 'Unauthorized' }, 401));

    await expect(apiClient.getWidgetConfig(7)).rejects.toThrow();
    expect(handler).toHaveBeenCalled();
    window.removeEventListener('auth:unauthorized', handler);
  });
});
