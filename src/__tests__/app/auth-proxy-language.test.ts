import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * SMA-260 — the four unauthenticated auth proxies.
 *
 * Defect (B): they used to read `error.detail` off the backend error body, but
 * the v2 backend error envelope NEVER emits `detail` (every handler funnels
 * through `ApiResponse.failed(message=...)`), so the real backend message —
 * e.g. the resend-cooldown copy — was discarded for ALL users. They must
 * surface `error.message`, keeping the English generic only as last resort.
 *
 * Defect (A): they hardcoded `Language: 'en'`; they must now forward a
 * caller-supplied `?language=` and send NO header when it is absent.
 */

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const { POST: sendVerification } = await import('@/app/api/auth/send-verification/route');
const { POST: verifyEmail } = await import('@/app/api/auth/verify-email/route');
const { POST: register } = await import('@/app/api/auth/register/route');
const { POST: resetPassword } = await import('@/app/api/auth/reset-password/route');

const ROUTES = [
  {
    name: 'send-verification',
    handler: sendVerification,
    path: '/api/auth/send-verification',
    body: { email: 'user@example.com', code_type: 'register' },
    fallback: 'Failed to send verification code',
  },
  {
    name: 'verify-email',
    handler: verifyEmail,
    path: '/api/auth/verify-email',
    body: { email: 'user@example.com', verification_code: '123456', code_type: 'register' },
    fallback: 'Verification failed',
  },
  {
    name: 'register',
    handler: register,
    path: '/api/auth/register',
    body: { email: 'user@example.com', password: 'pw12345678', verification_code: '123456' },
    fallback: 'Registration failed',
  },
  {
    name: 'reset-password',
    handler: resetPassword,
    path: '/api/auth/reset-password',
    body: { email: 'user@example.com', verification_code: '123456', password: 'pw12345678' },
    fallback: 'Password reset failed',
  },
] as const;

function mockRequest(path: string, body: unknown, query = ''): Request {
  return new Request(`http://localhost:3000${path}${query}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe.each(ROUTES)('POST $path', ({ handler, path, body, fallback }) => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('forwards ?language= as the backend Language header', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ success: true }) });

    await handler(mockRequest(path, body, '?language=kr') as never);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(init.headers).toEqual(expect.objectContaining({ Language: 'kr' }));
  });

  it('sends NO Language header when ?language= is absent', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ success: true }) });

    await handler(mockRequest(path, body) as never);

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(init.headers).not.toHaveProperty('Language');
  });

  it('surfaces the backend `message` field on error (v2 envelope has no `detail`)', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
      json: () =>
        Promise.resolve({
          code: 429,
          message: 'Please wait before requesting another verification code.',
        }),
    });

    const response = await handler(mockRequest(path, body) as never);
    const payload = await response.json();

    expect(response.status).toBe(429);
    expect(payload.message).toBe('Please wait before requesting another verification code.');
  });

  it('falls back to the generic message only when the backend body has none', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('not json')),
    });

    const response = await handler(mockRequest(path, body) as never);
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.message).toBe(fallback);
  });
});

describe('POST /api/auth/register — 409 account-exists path', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('preserves the 409 status the register page branches on', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 409,
      json: () => Promise.resolve({ code: 409, message: 'Email already registered' }),
    });

    const response = await register(
      mockRequest('/api/auth/register', {
        email: 'existing@example.com',
        password: 'pw12345678',
        verification_code: '123456',
      }) as never,
    );

    // The register page shows the account-exists panel on `res.status === 409`
    // (not on the message), so the status must pass through untouched.
    expect(response.status).toBe(409);
    expect((await response.json()).message).toBe('Email already registered');
  });
});
