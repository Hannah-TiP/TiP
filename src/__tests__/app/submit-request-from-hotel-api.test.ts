import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockAuth = vi.fn();
vi.mock('@/auth', () => ({
  auth: () => mockAuth(),
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const { POST } = await import('@/app/api/trips/submit-request-from-hotel/route');

function mockRequest(body: unknown, query = ''): NextRequest {
  return new NextRequest(`http://localhost:3000/api/trips/submit-request-from-hotel${query}`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/trips/submit-request-from-hotel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const response = await POST(
      mockRequest({
        hotel_id: 42,
        start_date: '2026-06-10',
        end_date: '2026-06-13',
        adults: 2,
        kids: 0,
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.message).toBe('Unauthorized');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('forwards the body and bearer token to the backend on success', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'tok-abc' });
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          data: {
            trip: {
              id: 77,
              user_id: 11,
              status: 'waiting-for-proposal',
              schema_version: 1,
            },
            session: { id: 1, user_id: 11, trip_id: 77, status: 'ai', schema_version: 1 },
            trip_version_id: 99,
          },
        }),
    });

    const response = await POST(
      mockRequest({
        hotel_id: 42,
        start_date: '2026-06-10',
        end_date: '2026-06-13',
        adults: 2,
        kids: 1,
      }),
    );
    const body = await response.json();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('/api/v2/trips/submit-request-from-hotel');
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual(
      expect.objectContaining({
        Authorization: 'Bearer tok-abc',
        'Content-Type': 'application/json',
      }),
    );
    // No `?language=` on the proxy request -> no Language header is invented
    // (SMA-260: the backend ladder resolves the user's stored preference).
    expect(init.headers).not.toHaveProperty('Language');
    expect(JSON.parse(init.body as string)).toEqual({
      hotel_id: 42,
      start_date: '2026-06-10',
      end_date: '2026-06-13',
      adults: 2,
      kids: 1,
    });
    expect(body.data.trip.id).toBe(77);
    expect(body.data.trip.status).toBe('waiting-for-proposal');
  });

  it('forwards a caller-supplied ?language= as the backend Language header', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'tok-abc' });
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: {} }),
    });

    await POST(
      mockRequest(
        {
          hotel_id: 42,
          start_date: '2026-06-10',
          end_date: '2026-06-13',
          adults: 2,
          kids: 0,
        },
        '?language=kr',
      ),
    );

    const [, init] = mockFetch.mock.calls[0];
    // The seeded concierge confirmation message is persisted in this
    // language — a KR user's first chat message must be stored in Korean.
    expect(init.headers).toEqual(expect.objectContaining({ Language: 'kr' }));
  });

  it('propagates backend error status and message', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'tok-abc' });
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ message: 'Hotel not found' }),
    });

    const response = await POST(
      mockRequest({
        hotel_id: 9999,
        start_date: '2026-06-10',
        end_date: '2026-06-13',
        adults: 2,
        kids: 0,
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.message).toBe('Hotel not found');
  });

  it('returns 500 on unexpected fetch errors', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'tok-abc' });
    mockFetch.mockRejectedValue(new Error('boom'));

    const response = await POST(
      mockRequest({
        hotel_id: 42,
        start_date: '2026-06-10',
        end_date: '2026-06-13',
        adults: 2,
        kids: 0,
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
  });
});
