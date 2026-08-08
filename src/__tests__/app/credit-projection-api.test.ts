import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAuth = vi.fn();
vi.mock('@/auth', () => ({
  auth: () => mockAuth(),
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const { GET } = await import('@/app/api/me/credits/projected/route');

const PROJECTION = {
  user_id: 7,
  has_paid_trips: true,
  projections: [
    {
      trip_id: 42,
      trip_title: 'Kyoto',
      eligible_spend_cents: 100000,
      currency: 'USD',
      tier_rate: 0.005,
      projected_amount_cents: 500,
      blocking_reason: 'awaiting_review',
    },
  ],
};

describe('GET /api/me/credits/projected', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated and never calls the backend', async () => {
    mockAuth.mockResolvedValue(null);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.message).toBe('Unauthorized');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('forwards the bearer token to the self-scoped backend route and passes the envelope through', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'test-token-123' });
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ code: 200, message: 'Success', data: PROJECTION }),
    });

    const response = await GET();
    const body = await response.json();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v2/me/credits/projected'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token-123',
        }),
      }),
    );
    // Self-scoped: the proxy sends no user_id anywhere.
    expect(String(mockFetch.mock.calls[0][0])).not.toContain('user_id');
    expect(response.status).toBe(200);
    expect(body.data).toEqual(PROJECTION);
  });

  it('surfaces the backend error message and status (v2 envelope uses `message`)', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'test-token-123' });
    mockFetch.mockResolvedValue({
      ok: false,
      status: 503,
      json: () => Promise.resolve({ message: 'Service unavailable' }),
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.success).toBe(false);
    expect(body.message).toBe('Service unavailable');
  });

  it('returns 500 on unexpected errors', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'test-token-123' });
    mockFetch.mockRejectedValue(new Error('Network error'));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.message).toBe('Internal server error');
  });
});
