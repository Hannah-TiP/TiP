import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAuth = vi.fn();
vi.mock('@/auth', () => ({
  auth: () => mockAuth(),
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const { POST } = await import('@/app/api/quotes/[id]/checkout-session/route');

function mockRequest(): Request {
  return new Request('http://localhost:3000/api/quotes/42/checkout-session', { method: 'POST' });
}

function mockParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe('POST /api/quotes/[id]/checkout-session', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const response = await POST(mockRequest() as never, mockParams('42') as never);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.message).toBe('Unauthorized');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('forwards POST to the v2 backend with the bearer token', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'tok-xyz' });
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: { checkout_url: 'https://checkout.demo.flywire.com/abc', payment_id: 7 },
        }),
    });

    const response = await POST(mockRequest() as never, mockParams('42') as never);
    const body = await response.json();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v2/quotes/42/checkout-session'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer tok-xyz',
          Language: 'en',
        }),
      }),
    );
    expect(body.data.payment_id).toBe(7);
  });

  it('propagates backend error status', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'tok-xyz' });
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: 'Quote must be in SENT status' }),
    });

    const response = await POST(mockRequest() as never, mockParams('11') as never);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.message).toMatch(/SENT status/);
  });

  it('returns 500 on unexpected errors', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'tok-xyz' });
    mockFetch.mockRejectedValue(new Error('boom'));

    const response = await POST(mockRequest() as never, mockParams('42') as never);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
  });
});
