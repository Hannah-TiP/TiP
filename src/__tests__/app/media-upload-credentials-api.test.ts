import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAuth = vi.fn();
vi.mock('@/auth', () => ({
  auth: () => mockAuth(),
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const { POST } = await import('@/app/api/media/get-upload-credentials/route');

function mockRequest(body: unknown): Request {
  return new Request('http://localhost:3000/api/media/get-upload-credentials', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('POST /api/media/get-upload-credentials', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const response = await POST(
      mockRequest({ session_id: 's1', media_type: 'image', file_extension: 'jpg' }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns 400 when required fields are missing', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'test-token-123' });

    const response = await POST(mockRequest({ session_id: 's1', media_type: 'image' }) as never);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('forwards to the v2 media endpoint with the bearer token', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'test-token-123' });
    const credentials = {
      code: 200,
      message: 'Success',
      data: { upload_url: 'https://s3.example.com/', upload_key: 'users/1/image/x.jpg' },
    };
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(credentials),
    });

    const response = await POST(
      mockRequest({ session_id: 's1', media_type: 'image', file_extension: 'jpg' }) as never,
    );
    const body = await response.json();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v2/media/get-upload-credentials'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token-123',
        }),
      }),
    );
    expect(mockFetch.mock.calls[0][0]).not.toContain('/api/v1/');
    const forwarded = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(forwarded).toEqual({ session_id: 's1', media_type: 'image', file_extension: 'jpg' });
    expect(body).toEqual(credentials);
  });

  it('passes through the backend error message and status', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'test-token-123' });
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ message: 'Session not found' }),
    });

    const response = await POST(
      mockRequest({ session_id: 'missing', media_type: 'image', file_extension: 'jpg' }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.message).toBe('Session not found');
  });

  it('returns 500 on unexpected errors', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'test-token-123' });
    mockFetch.mockRejectedValue(new Error('Network error'));

    const response = await POST(
      mockRequest({ session_id: 's1', media_type: 'image', file_extension: 'jpg' }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.message).toBe('Internal server error');
  });
});
