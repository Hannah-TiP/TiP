import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAuth = vi.fn();
vi.mock('@/auth', () => ({
  auth: () => mockAuth(),
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const { POST: credentialsPOST } = await import('@/app/api/reviews/photo-upload-credentials/route');
const { POST: finalizePOST } = await import('@/app/api/reviews/photos/finalize/route');
const { GET: byEntityGET } =
  await import('@/app/api/reviews/by-entity/[entity_type]/[entity_id]/route');

function postRequest(path: string, body: unknown): Request {
  return new Request(`http://localhost:3000${path}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

const credentialsBody = {
  trip_id: 3,
  entity_type: 'hotel',
  entity_id: 10,
  content_type: 'image/jpeg',
};

describe('POST /api/reviews/photo-upload-credentials', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const response = await credentialsPOST(
      postRequest('/api/reviews/photo-upload-credentials', credentialsBody) as never,
    );

    expect(response.status).toBe(401);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('forwards the body, bearer token, and Language header to the v2 endpoint', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'token-1' });
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ code: 200, data: { upload_url: 'https://s3/' } }),
    });

    const response = await credentialsPOST(
      postRequest('/api/reviews/photo-upload-credentials?language=kr', credentialsBody) as never,
    );
    const body = await response.json();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v2/reviews/photo-upload-credentials'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-1',
          Language: 'kr',
        }),
        body: JSON.stringify(credentialsBody),
      }),
    );
    expect(body.data.upload_url).toBe('https://s3/');
  });

  it('surfaces the backend message and status on failure', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'token-1' });
    mockFetch.mockResolvedValue({
      ok: false,
      status: 403,
      json: () => Promise.resolve({ code: 403, message: 'Not your trip' }),
    });

    const response = await credentialsPOST(
      postRequest('/api/reviews/photo-upload-credentials', credentialsBody) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.message).toBe('Not your trip');
  });
});

describe('POST /api/reviews/photos/finalize', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const response = await finalizePOST(
      postRequest('/api/reviews/photos/finalize', { s3_key: 'k' }) as never,
    );

    expect(response.status).toBe(401);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('passes the success envelope through', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'token-1' });
    const envelope = { code: 200, data: { original: 'reviews/media/1/a.jpg' } };
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(envelope),
    });

    const response = await finalizePOST(
      postRequest('/api/reviews/photos/finalize', { s3_key: 'reviews/uploads/1/a.jpg' }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(envelope);
  });

  it('preserves the backend business code + status on failure (4005 HEIC)', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'token-1' });
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ code: 4005, message: 'Convert to JPEG' }),
    });

    const response = await finalizePOST(
      postRequest('/api/reviews/photos/finalize', { s3_key: 'reviews/uploads/1/a.heic' }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.code).toBe(4005);
    expect(body.message).toBe('Convert to JPEG');
  });
});

describe('GET /api/reviews/by-entity/[entity_type]/[entity_id]', () => {
  const params = Promise.resolve({ entity_type: 'hotel', entity_id: '10' });

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ code: 200, data: { reviews: [] } }),
    });
  });

  it('forwards the bearer token when a session exists (author photos)', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'token-1' });

    await byEntityGET(
      new Request('http://localhost:3000/api/reviews/by-entity/hotel/10') as never,
      {
        params,
      },
    );

    const [, init] = mockFetch.mock.calls[0];
    expect(init.headers.Authorization).toBe('Bearer token-1');
  });

  it('stays public — no auth header without a session', async () => {
    mockAuth.mockResolvedValue(null);

    const response = await byEntityGET(
      new Request('http://localhost:3000/api/reviews/by-entity/hotel/10') as never,
      { params },
    );

    expect(response.status).toBe(200);
    const [, init] = mockFetch.mock.calls[0];
    expect(init.headers.Authorization).toBeUndefined();
  });

  it('still responds when the auth lookup throws', async () => {
    mockAuth.mockRejectedValue(new Error('jwt malformed'));

    const response = await byEntityGET(
      new Request('http://localhost:3000/api/reviews/by-entity/hotel/10') as never,
      { params },
    );

    expect(response.status).toBe(200);
    const [, init] = mockFetch.mock.calls[0];
    expect(init.headers.Authorization).toBeUndefined();
  });
});
