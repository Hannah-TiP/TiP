import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAuth = vi.fn();
vi.mock('@/auth', () => ({
  auth: () => mockAuth(),
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const { POST } = await import('@/app/api/quotes/[id]/zero-total-payment/route');

function mockRequest(): Request {
  return new Request('http://localhost:3000/api/quotes/42/zero-total-payment', {
    method: 'POST',
  });
}

function mockParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe('POST /api/quotes/[id]/zero-total-payment', () => {
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
          data: { quote: { id: 42, status: 'PAID' }, current_version: null },
        }),
    });

    const response = await POST(mockRequest() as never, mockParams('42') as never);
    const body = await response.json();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v2/quotes/42/zero-total-payment'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer tok-xyz',
          Language: 'en',
        }),
      }),
    );
    expect(body.data.quote.status).toBe('PAID');
  });

  it('propagates backend error status', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'tok-xyz' });
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: 'This quote still has an amount due' }),
    });

    const response = await POST(mockRequest() as never, mockParams('11') as never);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.message).toMatch(/amount due/);
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
