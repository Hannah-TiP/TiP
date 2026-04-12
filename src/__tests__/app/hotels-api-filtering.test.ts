import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Import the route handler
import { GET } from '@/app/api/hotels/route';

describe('GET /api/hotels (server-side filtering)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('forwards country_id to backend', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    });

    const request = new NextRequest('http://localhost:3000/api/hotels?country_id=5&language=en');
    await GET(request);

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('country_id=5');
  });

  it('forwards star_rating to backend', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    });

    const request = new NextRequest('http://localhost:3000/api/hotels?star_rating=5');
    await GET(request);

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('star_rating=5');
  });

  it('forwards q (name search) to backend', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    });

    const request = new NextRequest('http://localhost:3000/api/hotels?q=aman');
    await GET(request);

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('q=aman');
  });

  it('forwards all filter params together', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/hotels?country_id=3&city_id=7&star_rating=4&q=park&include_draft=true',
    );
    await GET(request);

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('country_id=3');
    expect(calledUrl).toContain('city_id=7');
    expect(calledUrl).toContain('star_rating=4');
    expect(calledUrl).toContain('q=park');
    expect(calledUrl).toContain('include_draft=true');
  });

  it('does not send params that are not provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    });

    const request = new NextRequest('http://localhost:3000/api/hotels');
    await GET(request);

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).not.toContain('country_id');
    expect(calledUrl).not.toContain('star_rating');
    expect(calledUrl).not.toContain('q=');
    expect(calledUrl).not.toContain('city_id');
  });
});
