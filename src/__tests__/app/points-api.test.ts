import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAuth = vi.fn();
vi.mock('@/auth', () => ({
  auth: () => mockAuth(),
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const { GET } = await import('@/app/api/me/points/route');

const LEDGER = {
  user_id: 7,
  balance_points: 24500,
  transactions: [
    {
      id: 1,
      user_id: 7,
      source: 'manual',
      status: 'issued',
      kind: 'grant',
      delta_points: 24500,
      created_at: '2026-09-01T00:00:00Z',
    },
  ],
};

function request(url = 'http://localhost/api/me/points', headers?: Record<string, string>) {
  return new Request(url, { headers });
}

function okBackend() {
  mockFetch.mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ code: 200, message: 'Success', data: LEDGER }),
  });
}

describe('GET /api/me/points', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated and never calls the backend', async () => {
    mockAuth.mockResolvedValue(null);

    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.message).toBe('Unauthorized');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('forwards the bearer token to /api/v2/me/points and passes the envelope through', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'test-token-123' });
    okBackend();

    const response = await GET(request());
    const body = await response.json();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v2/me/points'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token-123',
        }),
      }),
    );
    expect(response.status).toBe(200);
    expect(body.data).toEqual(LEDGER);
  });

  it('never invents a Language header when the caller sent none', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'test-token-123' });
    okBackend();

    await GET(request());

    const headers = mockFetch.mock.calls[0][1].headers as Record<string, string>;
    expect(Object.keys(headers)).not.toContain('Language');
  });

  it('forwards an incoming Language header verbatim', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'test-token-123' });
    okBackend();

    await GET(request('http://localhost/api/me/points', { Language: 'kr' }));

    const headers = mockFetch.mock.calls[0][1].headers as Record<string, string>;
    expect(headers.Language).toBe('kr');
  });

  it('forwards a caller-supplied ?language= as the Language header', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'test-token-123' });
    okBackend();

    await GET(request('http://localhost/api/me/points?language=en'));

    const headers = mockFetch.mock.calls[0][1].headers as Record<string, string>;
    expect(headers.Language).toBe('en');
  });

  it('surfaces the backend error message and status (v2 envelope uses `message`)', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'test-token-123' });
    mockFetch.mockResolvedValue({
      ok: false,
      status: 503,
      json: () => Promise.resolve({ message: 'Service unavailable' }),
    });

    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.success).toBe(false);
    expect(body.message).toBe('Service unavailable');
  });

  it('returns 500 on unexpected errors', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'test-token-123' });
    mockFetch.mockRejectedValue(new Error('Network error'));

    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.message).toBe('Internal server error');
  });
});
