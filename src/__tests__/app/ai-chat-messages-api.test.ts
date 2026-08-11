import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockAuth = vi.fn();
vi.mock('@/auth', () => ({
  auth: () => mockAuth(),
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const { GET } = await import('@/app/api/ai-chat/trips/[trip_id]/messages/route');

function makeContext(tripId: string) {
  return { params: Promise.resolve({ trip_id: tripId }) };
}

describe('GET /api/ai-chat/trips/[trip_id]/messages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ accessToken: 'test-token' });
  });

  it('forwards before and limit query params to the backend', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) });

    const request = new NextRequest(
      'http://localhost:3000/api/ai-chat/trips/42/messages?before=910&limit=100',
    );
    const response = await GET(request, makeContext('42'));

    expect(response.status).toBe(200);
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('/api/v2/ai-chat/trips/42/messages?');
    expect(calledUrl).toContain('before=910');
    expect(calledUrl).toContain('limit=100');
  });

  it('sends no query string when neither param is supplied (tail read)', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) });

    const request = new NextRequest('http://localhost:3000/api/ai-chat/trips/42/messages');
    await GET(request, makeContext('42'));

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toBe(
      `${process.env.API_BASE_URL || 'http://localhost:8000'}/api/v2/ai-chat/trips/42/messages`,
    );
    expect(calledUrl).not.toContain('?');
  });

  it('forwards only the supplied param', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) });

    const request = new NextRequest(
      'http://localhost:3000/api/ai-chat/trips/42/messages?limit=100',
    );
    await GET(request, makeContext('42'));

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('limit=100');
    expect(calledUrl).not.toContain('before=');
  });

  it('returns 401 without a session and never calls the backend', async () => {
    mockAuth.mockResolvedValue(null);

    const request = new NextRequest(
      'http://localhost:3000/api/ai-chat/trips/42/messages?before=910&limit=100',
    );
    const response = await GET(request, makeContext('42'));

    expect(response.status).toBe(401);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('surfaces the backend error message and status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ message: 'Trip not found' }),
    });

    const request = new NextRequest('http://localhost:3000/api/ai-chat/trips/42/messages');
    const response = await GET(request, makeContext('42'));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.message).toBe('Trip not found');
  });
});
