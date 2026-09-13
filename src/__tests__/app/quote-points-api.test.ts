import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAuth = vi.fn();
vi.mock('@/auth', () => ({
  auth: () => mockAuth(),
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const { GET } = await import('@/app/api/quotes/[id]/eligible-credits/route');
const { POST, DELETE } = await import('@/app/api/quotes/[id]/credits/route');

function mockParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

function okBackend(data: unknown) {
  mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ data }) });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/quotes/[id]/eligible-credits (wallet summary)', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    const request = new Request('http://localhost:3000/api/quotes/42/eligible-credits');

    const response = await GET(request as never, mockParams('42') as never);
    expect(response.status).toBe(401);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('forwards to the v2 backend with the bearer token and NO invented Language header', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'tok-abc' });
    okBackend({ balance_points: 20000 });
    const request = new Request('http://localhost:3000/api/quotes/42/eligible-credits');

    const response = await GET(request as never, mockParams('42') as never);
    const body = await response.json();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v2/quotes/42/eligible-credits'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer tok-abc' }),
      }),
    );
    const headers = mockFetch.mock.calls[0][1].headers as Record<string, string>;
    expect(headers.Language).toBeUndefined();
    expect(body.data.balance_points).toBe(20000);
  });

  it('forwards ?language= as the Language header (SMA-260)', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'tok-abc' });
    okBackend({ balance_points: 0 });
    const request = new Request('http://localhost:3000/api/quotes/42/eligible-credits?language=kr');

    await GET(request as never, mockParams('42') as never);
    const headers = mockFetch.mock.calls[0][1].headers as Record<string, string>;
    expect(headers.Language).toBe('kr');
  });

  it('passes the backend error message + status through', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'tok-abc' });
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ message: '견적을 찾을 수 없습니다.' }),
    });
    const request = new Request('http://localhost:3000/api/quotes/42/eligible-credits');

    const response = await GET(request as never, mockParams('42') as never);
    const body = await response.json();
    expect(response.status).toBe(404);
    expect(body.message).toBe('견적을 찾을 수 없습니다.');
  });
});

describe('POST /api/quotes/[id]/credits (apply points)', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    const request = new Request('http://localhost:3000/api/quotes/42/credits', {
      method: 'POST',
      body: JSON.stringify({ points: 1000 }),
    });

    const response = await POST(request as never, mockParams('42') as never);
    expect(response.status).toBe(401);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('forwards the body verbatim to POST /api/v2/quotes/{id}/credits with the Language header', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'tok-abc' });
    okBackend({ quote: { id: 42 } });
    const request = new Request('http://localhost:3000/api/quotes/42/credits?language=kr', {
      method: 'POST',
      body: JSON.stringify({ points: 1000 }),
    });

    await POST(request as never, mockParams('42') as never);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v2/quotes/42/credits'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ points: 1000 }) }),
    );
    const headers = mockFetch.mock.calls[0][1].headers as Record<string, string>;
    expect(headers.Language).toBe('kr');
  });

  it('passes the backend validation message through (server stays authoritative)', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'tok-abc' });
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: 'You can apply up to 2,500 P to this booking.' }),
    });
    const request = new Request('http://localhost:3000/api/quotes/42/credits', {
      method: 'POST',
      body: JSON.stringify({ points: 999999 }),
    });

    const response = await POST(request as never, mockParams('42') as never);
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.message).toMatch(/up to 2,500 P/);
  });

  it('returns 500 on unexpected errors', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'tok-abc' });
    mockFetch.mockRejectedValue(new Error('boom'));
    const request = new Request('http://localhost:3000/api/quotes/42/credits', {
      method: 'POST',
      body: '{}',
    });

    const response = await POST(request as never, mockParams('42') as never);
    expect(response.status).toBe(500);
  });
});

describe('DELETE /api/quotes/[id]/credits (remove points)', () => {
  it('forwards to DELETE /api/v2/quotes/{id}/credits without a body', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'tok-abc' });
    okBackend({ quote: { id: 42 } });
    const request = new Request('http://localhost:3000/api/quotes/42/credits', {
      method: 'DELETE',
    });

    const response = await DELETE(request as never, mockParams('42') as never);
    const body = await response.json();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v2/quotes/42/credits'),
      expect.objectContaining({ method: 'DELETE' }),
    );
    expect(mockFetch.mock.calls[0][1].body).toBeUndefined();
    expect(body.data.quote.id).toBe(42);
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    const request = new Request('http://localhost:3000/api/quotes/42/credits', {
      method: 'DELETE',
    });

    const response = await DELETE(request as never, mockParams('42') as never);
    expect(response.status).toBe(401);
  });
});
