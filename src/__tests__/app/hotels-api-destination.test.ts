import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Import the route handler
import { GET } from '@/app/api/hotels/route';

describe('GET /api/hotels ID-based destination filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('forwards region_id param to backend', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    });

    const request = new NextRequest('http://localhost:3000/api/hotels?region_id=5&language=en');
    await GET(request);

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('region_id=5');
  });

  it('forwards country_id param to backend', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    });

    const request = new NextRequest('http://localhost:3000/api/hotels?country_id=3&language=en');
    await GET(request);

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('country_id=3');
  });

  it('forwards city_id param to backend', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    });

    const request = new NextRequest('http://localhost:3000/api/hotels?city_id=7&language=en');
    await GET(request);

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('city_id=7');
  });

  it('forwards region_id with other filters', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    });

    const request = new NextRequest('http://localhost:3000/api/hotels?region_id=5&star_rating=5');
    await GET(request);

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('region_id=5');
    expect(calledUrl).toContain('star_rating=5');
  });

  it('does not send destination param (removed)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    });

    const request = new NextRequest('http://localhost:3000/api/hotels?star_rating=4');
    await GET(request);

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).not.toContain('destination');
  });
});
