import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockAuth = vi.fn();
vi.mock('@/auth', () => ({
  auth: () => mockAuth(),
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const { GET } = await import('@/app/api/quotes/route');

function mockRequest(url: string): NextRequest {
  return new NextRequest(url);
}

describe('GET /api/quotes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const response = await GET(mockRequest('http://localhost:3000/api/quotes?trip_id=7'));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.message).toBe('Unauthorized');
  });

  it('returns 400 when trip_id is missing', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'tok-abc' });

    const response = await GET(mockRequest('http://localhost:3000/api/quotes'));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.message).toBe('trip_id is required');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('forwards the trip_id query and auth header to the backend', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'tok-abc' });
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: [{ quote: { id: 99, trip_id: 7 }, current_version: null }],
        }),
    });

    const response = await GET(mockRequest('http://localhost:3000/api/quotes?trip_id=7'));
    const body = await response.json();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v2/quotes?trip_id=7'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer tok-abc',
          Language: 'en',
        }),
      }),
    );
    expect(body.data[0].quote.id).toBe(99);
  });

  it('propagates backend error status', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'tok-abc' });
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ message: 'Trip not found' }),
    });

    const response = await GET(mockRequest('http://localhost:3000/api/quotes?trip_id=999'));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.message).toBe('Trip not found');
  });

  it('returns 500 on unexpected errors', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'tok-abc' });
    mockFetch.mockRejectedValue(new Error('boom'));

    const response = await GET(mockRequest('http://localhost:3000/api/quotes?trip_id=7'));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
  });
});
