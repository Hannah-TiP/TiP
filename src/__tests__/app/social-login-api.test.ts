import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// The route module reads API_BASE_URL at import time and returns 500 when it
// is missing, so it must be set before the dynamic import below.
process.env.API_BASE_URL = 'http://backend.test';

const { POST } = await import('@/app/api/auth/social-login/route');

function mockRequest(body: Record<string, unknown>, headers: Record<string, string> = {}): Request {
  return new Request('http://localhost:3000/api/auth/social-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

function backendCall(): { url: string; init: RequestInit } {
  const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
  return { url, init };
}

function bodySentToBackend(): Record<string, unknown> {
  return JSON.parse(backendCall().init.body as string);
}

function languageSentToBackend(): string | undefined {
  return (backendCall().init.headers as Record<string, string>).Language;
}

describe('POST /api/auth/social-login — auth-code flow passthrough (SMA-119)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { access_token: 'at', refresh_token: 'rt' } }),
    });
  });

  it('forwards provider + auth_code to the v2 backend', async () => {
    await POST(mockRequest({ provider: 'google', auth_code: '4/0AbCdEf' }) as never);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(backendCall().url).toMatch(/\/api\/v2\/auth\/social-login$/);
    expect(bodySentToBackend()).toEqual({ provider: 'google', auth_code: '4/0AbCdEf' });
  });

  it('still forwards the legacy id_token when present', async () => {
    await POST(mockRequest({ provider: 'google', id_token: 'legacy.jwt.token' }) as never);

    expect(bodySentToBackend()).toEqual({ provider: 'google', id_token: 'legacy.jwt.token' });
  });

  it('omits absent credential fields instead of sending undefined/null', async () => {
    await POST(mockRequest({ provider: 'google', auth_code: '4/0AbCdEf' }) as never);

    expect(bodySentToBackend()).not.toHaveProperty('id_token');
  });

  it("forwards the user's Language header to the backend", async () => {
    await POST(
      mockRequest({ provider: 'google', auth_code: '4/0AbCdEf' }, { Language: 'kr' }) as never,
    );

    expect(languageSentToBackend()).toBe('kr');
  });

  it('defaults the Language header to en when the caller sends none', async () => {
    await POST(mockRequest({ provider: 'google', auth_code: '4/0AbCdEf' }) as never);

    expect(languageSentToBackend()).toBe('en');
  });

  it('passes the backend error message and status through on failure', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ message: 'Invalid authorization code' }),
    });

    const response = await POST(
      mockRequest({ provider: 'google', auth_code: 'bad-code' }) as never,
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ message: 'Invalid authorization code' });
  });
});
