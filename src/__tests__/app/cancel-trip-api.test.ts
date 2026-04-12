import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAuth = vi.fn();
vi.mock('@/auth', () => ({
  auth: () => mockAuth(),
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// We need to test the route handler logic directly
// Import after mocking
const { POST } = await import('@/app/api/trip/[id]/cancel/route');

function mockRequest(): Request {
  return new Request('http://localhost:3000/api/trip/1/cancel', { method: 'POST' });
}

function mockParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe('POST /api/trip/[id]/cancel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const response = await POST(mockRequest() as never, mockParams('1') as never);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.message).toBe('Unauthorized');
  });

  it('returns 401 when session has no access token', async () => {
    mockAuth.mockResolvedValue({ accessToken: null });

    const response = await POST(mockRequest() as never, mockParams('1') as never);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
  });

  it('forwards cancel request to backend with auth header', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'test-token-123' });
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { id: 42, status: 'canceled' } }),
    });

    const response = await POST(mockRequest() as never, mockParams('42') as never);
    const body = await response.json();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v2/trips/42/cancel'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token-123',
        }),
      }),
    );
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('canceled');
  });

  it('returns backend error status when backend rejects cancel', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'test-token-123' });
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: 'Trip is already canceled' }),
    });

    const response = await POST(mockRequest() as never, mockParams('1') as never);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.message).toBe('Trip is already canceled');
  });

  it('returns 500 on unexpected errors', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'test-token-123' });
    mockFetch.mockRejectedValue(new Error('Network error'));

    const response = await POST(mockRequest() as never, mockParams('1') as never);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.message).toBe('Internal server error');
  });
});
