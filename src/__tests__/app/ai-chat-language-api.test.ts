import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// SMA-469: the ai-chat proxies forward the `Language` header ONLY when the
// caller supplied ?language= (SMA-260 "forward, never invent"). Before this,
// messages/create-session sent no header at all and request-human hardcoded
// 'en', so the backend fell back to the account's stored preference and the
// concierge answered in Korean on the EN site.

const mockAuth = vi.fn();
vi.mock('@/auth', () => ({
  auth: () => mockAuth(),
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const { POST: messagesPOST, GET: messagesGET } =
  await import('@/app/api/ai-chat/trips/[trip_id]/messages/route');
const { POST: createSessionPOST } = await import('@/app/api/ai-chat/create-session-for-trip/route');
const { POST: requestHumanPOST } =
  await import('@/app/api/ai-chat/trips/[trip_id]/request-human/route');

const params = { params: Promise.resolve({ trip_id: '7' }) };

function request(path: string, method: 'GET' | 'POST', body?: unknown): Request {
  return new Request(`http://localhost:3000${path}`, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function backendHeaders(): Record<string, string> {
  return (mockFetch.mock.calls[0][1] as { headers: Record<string, string> }).headers;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ accessToken: 'token-1' });
  mockFetch.mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ code: 200, data: {} }),
  });
});

describe('ai-chat proxies forward the site language (SMA-469)', () => {
  it('messages POST forwards Language when ?language= is present', async () => {
    await messagesPOST(
      request('/api/ai-chat/trips/7/messages?language=en', 'POST', { content: 'ok' }) as never,
      params as never,
    );
    expect(backendHeaders().Language).toBe('en');
  });

  it('messages POST sends no Language header when the param is absent', async () => {
    await messagesPOST(
      request('/api/ai-chat/trips/7/messages', 'POST', { content: 'ok' }) as never,
      params as never,
    );
    expect(backendHeaders()).not.toHaveProperty('Language');
  });

  it('messages GET forwards Language', async () => {
    // The GET handler reads `request.nextUrl`, so it needs a real NextRequest.
    await messagesGET(
      new NextRequest('http://localhost:3000/api/ai-chat/trips/7/messages?before=9&language=kr'),
      params as never,
    );
    expect(backendHeaders().Language).toBe('kr');
    expect(mockFetch.mock.calls[0][0]).toContain('before=9');
  });

  it('create-session-for-trip forwards Language', async () => {
    await createSessionPOST(
      request('/api/ai-chat/create-session-for-trip?language=en', 'POST', { trip_id: 7 }) as never,
    );
    expect(backendHeaders().Language).toBe('en');
  });

  it('request-human no longer invents Language: absent param → no header', async () => {
    await requestHumanPOST(
      request('/api/ai-chat/trips/7/request-human', 'POST') as never,
      params as never,
    );
    expect(backendHeaders()).not.toHaveProperty('Language');
  });

  it('request-human forwards Language when given', async () => {
    await requestHumanPOST(
      request('/api/ai-chat/trips/7/request-human?language=kr', 'POST') as never,
      params as never,
    );
    expect(backendHeaders().Language).toBe('kr');
  });
});
