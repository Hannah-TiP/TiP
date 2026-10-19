import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAuth = vi.fn();
vi.mock('@/auth', () => ({
  auth: () => mockAuth(),
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const { GET } = await import('@/app/api/cities/suggestions/route');
const { POST } = await import('@/app/api/cities/resolve/route');

function backend(status: number, body: unknown) {
  mockFetch.mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

function headers(): Record<string, string> {
  return mockFetch.mock.calls[0][1].headers as Record<string, string>;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/cities/suggestions (SMA-644)', () => {
  it('returns 401 without a session and never calls the backend', async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET(
      new Request('http://localhost:3000/api/cities/suggestions?q=par') as never,
    );
    expect(res.status).toBe(401);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('forwards q + session_token with the bearer token and the caller language', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'tok-abc' });
    backend(200, { data: { source: 'google', suggestions: [] } });

    const res = await GET(
      new Request(
        'http://localhost:3000/api/cities/suggestions?q=par&session_token=s-1&language=kr',
      ) as never,
    );

    const target = mockFetch.mock.calls[0][0] as string;
    expect(target).toContain('/api/v2/locations/city-suggestions?q=par&session_token=s-1');
    expect(target).not.toContain('language=');
    expect(headers()).toMatchObject({
      Authorization: 'Bearer tok-abc',
      Language: 'kr',
      lang: 'kr',
    });
    expect((await res.json()).data.source).toBe('google');
  });

  it('does not invent a language when the caller sent none', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'tok-abc' });
    backend(200, { data: { source: 'db', suggestions: [] } });
    await GET(new Request('http://localhost:3000/api/cities/suggestions?q=par') as never);
    expect(headers().Language).toBeUndefined();
    expect(headers().lang).toBeUndefined();
  });

  it('relays the v2 error envelope message', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'tok-abc' });
    backend(422, { code: 422, message: 'q too short' });
    const res = await GET(new Request('http://localhost:3000/api/cities/suggestions?q=p') as never);
    expect(res.status).toBe(422);
    expect((await res.json()).message).toBe('q too short');
  });
});

describe('POST /api/cities/resolve (SMA-644)', () => {
  function req(body: unknown, qs = '') {
    return new Request(`http://localhost:3000/api/cities/resolve${qs}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  it('returns 401 without a session', async () => {
    mockAuth.mockResolvedValue(null);
    const res = await POST(req({ place_id: 'x', session_token: null }) as never);
    expect(res.status).toBe(401);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('passes the body through verbatim with auth + language headers', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'tok-abc' });
    backend(200, { data: { id: 42 } });

    const res = await POST(
      req({ place_id: 'ChIJ-x', session_token: 's-1' }, '?language=en') as never,
    );

    expect(mockFetch.mock.calls[0][0]).toContain('/api/v2/locations/cities/resolve');
    const init = mockFetch.mock.calls[0][1] as RequestInit;
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ place_id: 'ChIJ-x', session_token: 's-1' });
    expect(headers()).toMatchObject({
      Authorization: 'Bearer tok-abc',
      Language: 'en',
      lang: 'en',
    });
    expect((await res.json()).data.id).toBe(42);
  });

  it('relays the v2 error envelope message', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'tok-abc' });
    backend(502, { code: 502, message: 'Places unavailable' });
    const res = await POST(req({ place_id: 'x', session_token: null }) as never);
    expect(res.status).toBe(502);
    expect((await res.json()).message).toBe('Places unavailable');
  });
});
