import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAuth = vi.fn();
vi.mock('@/auth', () => ({
  auth: () => mockAuth(),
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const { POST } = await import('@/app/api/me/change-password/route');

function mockRequest(body: unknown): Request {
  return new Request('http://localhost:3000/api/me/change-password', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('POST /api/me/change-password', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const response = await POST(mockRequest({ current_password: 'a', new_password: 'b' }) as never);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.message).toBe('Unauthorized');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('forwards only current/new password with the bearer token, never identity', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'test-token-123' });
    mockFetch.mockResolvedValue({ ok: true, status: 204 });

    const response = await POST(
      mockRequest({
        current_password: 'old-password',
        new_password: 'brand-new-password',
        email: 'attacker@example.com',
      }) as never,
    );
    const body = await response.json();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v2/auth/change-password'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token-123',
        }),
      }),
    );
    const forwarded = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(forwarded).toEqual({
      current_password: 'old-password',
      new_password: 'brand-new-password',
    });
    expect(forwarded.email).toBeUndefined();
    expect(body.success).toBe(true);
  });

  it('passes through the backend localized error message and status', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'test-token-123' });
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: 'Your current password is incorrect.' }),
    });

    const response = await POST(
      mockRequest({ current_password: 'wrong', new_password: 'brand-new-password' }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.message).toBe('Your current password is incorrect.');
  });

  it('returns 500 on unexpected errors', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'test-token-123' });
    mockFetch.mockRejectedValue(new Error('Network error'));

    const response = await POST(
      mockRequest({ current_password: 'a', new_password: 'brand-new-password' }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.message).toBe('Internal server error');
  });
});
