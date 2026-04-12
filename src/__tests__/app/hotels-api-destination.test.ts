import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Import the route handler
import { GET } from '@/app/api/hotels/route';

describe('GET /api/hotels destination parameter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('forwards destination param to backend', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/hotels?destination=Tokyo&language=en',
    );
    await GET(request);

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('destination=Tokyo');
  });

  it('forwards destination with other filters', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/hotels?destination=Japan&star_rating=5',
    );
    await GET(request);

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('destination=Japan');
    expect(calledUrl).toContain('star_rating=5');
  });

  it('does not send destination when not provided', async () => {
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
