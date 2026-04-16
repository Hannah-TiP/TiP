import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockAuth = vi.fn();
vi.mock('@/auth', () => ({
  auth: () => mockAuth(),
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const { POST } = await import('@/app/api/ai-chat/converse/route');

function mockRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/ai-chat/converse', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/ai-chat/converse', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    const res = await POST(mockRequest({ trip_id: 1, content: 'Hi' }));
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
  });

  it('returns 400 when trip_id missing', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'tok' });
    const res = await POST(mockRequest({ content: 'Hi' }));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.message).toMatch(/trip_id/i);
  });

  it('forwards request to backend v2 endpoint with bearer token and full payload', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'tok-abc' });
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          success: true,
          data: {
            response: 'ok',
            trip: { id: 1 },
            ui_blocks: [],
            field_updated: [],
          },
        }),
    });

    const widgetResponse = {
      widget_id: 'w1',
      widget_type: 'option_selector',
      value: { value: 'leisure', label: 'Leisure' },
    };

    const res = await POST(
      mockRequest({
        trip_id: 1,
        content: 'Hi',
        message_type: 'text',
        widget_response: widgetResponse,
      }),
    );
    const body = await res.json();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v2/ai-chat/trips/1/converse'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer tok-abc',
          'Content-Type': 'application/json',
        }),
      }),
    );

    const forwardedBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(forwardedBody).toEqual({
      content: 'Hi',
      message_type: 'text',
      widget_response: widgetResponse,
    });
    expect(body.success).toBe(true);
  });

  it('returns backend error status when backend rejects', async () => {
    mockAuth.mockResolvedValue({ accessToken: 'tok' });
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ detail: 'Failed to process message' }),
    });

    const res = await POST(mockRequest({ trip_id: 1, content: 'Hi' }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.message).toMatch(/process/);
  });
});
