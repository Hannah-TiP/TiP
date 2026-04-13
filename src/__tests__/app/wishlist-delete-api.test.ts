import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockAuth = vi.fn();
vi.mock('@/auth', () => ({
  auth: () => mockAuth(),
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const { DELETE } = await import('@/app/api/wishlist/[hotelId]/route');

function mockParams(hotelId: string) {
  return { params: Promise.resolve({ hotelId }) };
}

describe('DELETE /api/wishlist/[hotelId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/wishlist/5', {
      method: 'DELETE',
    });

    const response = await DELETE(request, mockParams('5') as never);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
  });

  it('forwards delete request to backend with correct hotel ID', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'test-token' });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: null, message: 'Removed from wishlist' }),
    });

    const request = new NextRequest('http://localhost:3000/api/wishlist/42', {
      method: 'DELETE',
    });

    const response = await DELETE(request, mockParams('42') as never);
    expect(response.status).toBe(200);

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain('/api/v2/wishlist/42');
    expect(options.method).toBe('DELETE');
  });
});
