import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAuth = vi.fn();
vi.mock('@/auth', () => ({
  auth: () => mockAuth(),
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const { GET } = await import('@/app/api/payments/[paymentId]/widget-config/route');

function mockRequest(): Request {
  return new Request('http://localhost:3000/api/payments/77/widget-config');
}

function mockParams(paymentId: string) {
  return { params: Promise.resolve({ paymentId }) };
}

describe('GET /api/payments/[paymentId]/widget-config', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const response = await GET(mockRequest() as never, mockParams('77') as never);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.message).toBe('Unauthorized');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('forwards GET to the v2 backend with the bearer token', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'tok-abc' });
    const cfg = {
      portal_code: 'TIP',
      amount: '1500.00',
      currency: 'USD',
      callback_url: 'https://api.example.com/api/v2/webhooks/flywire',
      callback_id: '77',
      callback_version: '2',
      return_url: 'https://www.example.com/quotes/3?paid=1',
      cancel_url: 'https://www.example.com/quotes/3?cancelled=1',
      booking_reference: '77',
    };
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: cfg }),
    });

    const response = await GET(mockRequest() as never, mockParams('77') as never);
    const body = await response.json();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v2/payments/77/widget-config'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer tok-abc',
          Language: 'en',
        }),
      }),
    );
    expect(body.data).toEqual(cfg);
  });

  it('propagates backend 404', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'tok-abc' });
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ message: 'Payment not found' }),
    });

    const response = await GET(mockRequest() as never, mockParams('999') as never);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.message).toBe('Payment not found');
  });

  it('returns 500 on unexpected errors', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'tok-abc' });
    mockFetch.mockRejectedValue(new Error('boom'));

    const response = await GET(mockRequest() as never, mockParams('77') as never);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
  });
});
