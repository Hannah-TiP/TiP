import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAuth = vi.fn();
vi.mock('@/auth', () => ({
  auth: () => mockAuth(),
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const { GET } = await import('@/app/api/quotes/[id]/route');

function mockRequest(): Request {
  return new Request('http://localhost:3000/api/quotes/42');
}

function mockParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe('GET /api/quotes/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const response = await GET(mockRequest() as never, mockParams('42') as never);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.message).toBe('Unauthorized');
  });

  it('forwards quote request to backend with auth header', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'tok-abc' });
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: { quote: { id: 42 }, current_version: null },
        }),
    });

    const response = await GET(mockRequest() as never, mockParams('42') as never);
    const body = await response.json();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v2/quotes/42'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer tok-abc',
          Language: 'en',
        }),
      }),
    );
    expect(body.data.quote.id).toBe(42);
  });

  it('propagates backend error status', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'tok-abc' });
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ message: 'Quote not found' }),
    });

    const response = await GET(mockRequest() as never, mockParams('999') as never);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.message).toBe('Quote not found');
  });

  it('returns 500 on unexpected errors', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'tok-abc' });
    mockFetch.mockRejectedValue(new Error('boom'));

    const response = await GET(mockRequest() as never, mockParams('42') as never);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
  });
});
