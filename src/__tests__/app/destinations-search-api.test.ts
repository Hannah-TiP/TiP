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

  it('forwards a blank/missing q (initial popular state) to the backend', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [{ id: 1, type: 'city', name: { en: 'Paris' } }] }),
    });

    const request = new NextRequest('http://localhost:3000/api/destinations/search?language=en');
    const response = await GET(request);
    const body = await response.json();

    // No q param is sent — the backend returns the top bookable destinations.
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).not.toContain('q=');
    expect(calledUrl).toContain('language=en');
    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
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
