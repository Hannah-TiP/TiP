import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { GET } from '@/app/api/destinations/search/route';

describe('GET /api/destinations/search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('forwards q param to backend', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [{ id: 1, type: 'city', name: { en: 'Tokyo' }, country_name: { en: 'Japan' } }],
      }),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/destinations/search?q=Tokyo&language=en',
    );
    const response = await GET(request);
    const body = await response.json();

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('q=Tokyo');
    expect(body.data).toHaveLength(1);
    expect(body.data[0].type).toBe('city');
  });

  it('returns 400 when q is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/destinations/search');
    const response = await GET(request);

    expect(response.status).toBe(400);
  });

  it('forwards limit param to backend', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/destinations/search?q=Japan&limit=5',
    );
    await GET(request);

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('limit=5');
  });

  it('handles backend error gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Internal error' }),
    });

    const request = new NextRequest('http://localhost:3000/api/destinations/search?q=Test');
    const response = await GET(request);

    expect(response.status).toBe(500);
  });
});
