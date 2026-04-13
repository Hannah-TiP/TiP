import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockAuth = vi.fn();
vi.mock('@/auth', () => ({
  auth: () => mockAuth(),
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const { GET, POST } = await import('@/app/api/wishlist/route');

describe('GET /api/wishlist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
  });

  it('proxies wishlist request to backend with auth header', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'test-token' });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [{ id: 10, slug: 'test', status: 'published' }] }),
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v2/wishlist'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      }),
    );
  });
});

describe('POST /api/wishlist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/wishlist', {
      method: 'POST',
      body: JSON.stringify({ hotel_id: 1 }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
  });

  it('forwards add-to-wishlist request to backend', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'test-token' });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { hotel_id: 5 } }),
    });

    const request = new NextRequest('http://localhost:3000/api/wishlist', {
      method: 'POST',
      body: JSON.stringify({ hotel_id: 5 }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain('/api/v2/wishlist');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({ hotel_id: 5 });
  });
});
