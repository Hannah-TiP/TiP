import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const { POST } = await import('@/app/api/auth/register/route');

function mockRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function bodySentToBackend(): Record<string, unknown> {
  const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
  return JSON.parse(init.body as string);
}

describe('POST /api/auth/register — referral code passthrough', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
  });

  it('forwards referral_code to the v2 backend when provided', async () => {
    await POST(
      mockRequest({
        email: 'newbie@example.com',
        password: 'pw12345678',
        verification_code: '123456',
        referral_code: 'K3R2W7XY',
      }) as never,
    );

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/api\/v2\/auth\/register$/);
    expect(bodySentToBackend()).toEqual(
      expect.objectContaining({
        email: 'newbie@example.com',
        password: 'pw12345678',
        verification_code: '123456',
        referral_code: 'K3R2W7XY',
      }),
    );
  });

  it('omits referral_code field entirely when not provided', async () => {
    await POST(
      mockRequest({
        email: 'alone@example.com',
        password: 'pw12345678',
        verification_code: '123456',
      }) as never,
    );

    const body = bodySentToBackend();
    expect(body).not.toHaveProperty('referral_code');
  });

  it('omits referral_code when caller passes empty string', async () => {
    await POST(
      mockRequest({
        email: 'empty-ref@example.com',
        password: 'pw12345678',
        verification_code: '123456',
        referral_code: '',
      }) as never,
    );

    expect(bodySentToBackend()).not.toHaveProperty('referral_code');
  });
});
