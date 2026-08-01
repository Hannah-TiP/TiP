import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { GET } from '@/app/api/signature-journeys/route';

function emptyPage() {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      data: { items: [], total: 0, per_page: 12, current_page: 1, last_page: 1, has_more: false },
    }),
  };
}

describe('GET /api/signature-journeys', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('forwards the q search param to the backend (SMA-229)', async () => {
    mockFetch.mockResolvedValueOnce(emptyPage());

    await GET(
      new NextRequest('http://localhost:3000/api/signature-journeys?q=Ritz%20Yacht&language=en'),
    );

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('/api/v2/signature-journeys?');
    expect(calledUrl).toContain('q=Ritz+Yacht');
  });

  it('forwards a Korean q untouched while the lang header stays the display language', async () => {
    mockFetch.mockResolvedValueOnce(emptyPage());

    await GET(
      new NextRequest(
        `http://localhost:3000/api/signature-journeys?q=${encodeURIComponent('모나코')}&language=en`,
      ),
    );

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain(`q=${encodeURIComponent('모나코')}`);
    const init = mockFetch.mock.calls[0][1] as { headers: Record<string, string> };
    expect(init.headers.lang).toBe('en');
  });

  it('composes q with city_id and pagination', async () => {
    mockFetch.mockResolvedValueOnce(emptyPage());

    await GET(
      new NextRequest(
        'http://localhost:3000/api/signature-journeys?q=yacht&city_id=10&page=2&per_page=100',
      ),
    );

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('q=yacht');
    expect(calledUrl).toContain('city_id=10');
    expect(calledUrl).toContain('page=2');
    expect(calledUrl).toContain('per_page=100');
  });

  it('omits q entirely when it is absent or empty', async () => {
    mockFetch.mockResolvedValueOnce(emptyPage());

    await GET(new NextRequest('http://localhost:3000/api/signature-journeys?q=&per_page=100'));

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).not.toContain('q=');
    expect(calledUrl).toContain('per_page=100');
  });
});
