import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockAuth = vi.fn();
vi.mock('@/auth', () => ({
  auth: () => mockAuth(),
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const { POST: credentialsPOST } =
  await import('@/app/api/ai-chat/trips/[trip_id]/attachments/upload-credentials/route');
const { POST: finalizePOST } =
  await import('@/app/api/ai-chat/trips/[trip_id]/attachments/finalize/route');
const { POST: messagesPOST } = await import('@/app/api/ai-chat/trips/[trip_id]/messages/route');

const ctx = { params: Promise.resolve({ trip_id: '42' }) };

function postRequest(path: string, body: unknown): NextRequest {
  return new NextRequest(`http://localhost:3000${path}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

const routes = [
  { name: 'upload-credentials', POST: credentialsPOST, body: { content_type: 'image/heic' } },
  {
    name: 'finalize',
    POST: finalizePOST,
    body: { s3_key: 'chat/uploads/42/a.heic', file_name: 'IMG_1.HEIC' },
  },
];

describe.each(routes)(
  'POST /api/ai-chat/trips/[trip_id]/attachments/$name',
  ({ name, POST, body }) => {
    const path = `/api/ai-chat/trips/42/attachments/${name}`;

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('returns 401 without a session and never calls the backend', async () => {
      mockAuth.mockResolvedValue(null);
      const response = await POST(postRequest(path, body), ctx);
      expect(response.status).toBe(401);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('forwards the body, bearer token and Language header', async () => {
      mockAuth.mockResolvedValue({ accessToken: 'token-1' });
      const envelope = { code: 200, data: { ok: true } };
      mockFetch.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(envelope) });

      const response = await POST(postRequest(`${path}?language=kr`, body), ctx);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(new RegExp(`/api/v2/ai-chat/trips/42/attachments/${name}$`)),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ Authorization: 'Bearer token-1', Language: 'kr' }),
          body: JSON.stringify(body),
        }),
      );
      expect(await response.json()).toEqual(envelope);
    });

    it('never invents a Language header', async () => {
      mockAuth.mockResolvedValue({ accessToken: 'token-1' });
      mockFetch.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({}) });

      await POST(postRequest(path, body), ctx);

      const [, init] = mockFetch.mock.calls[0];
      expect(init.headers.Language).toBeUndefined();
    });

    it('preserves the backend status + v2 envelope (message, code) on rejection', async () => {
      mockAuth.mockResolvedValue({ accessToken: 'token-1' });
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ code: 4001, message: 'Unsupported file type' }),
      });

      const response = await POST(postRequest(path, body), ctx);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.code).toBe(4001);
      expect(json.message).toBe('Unsupported file type');
    });
  },
);

describe('POST /api/ai-chat/trips/[trip_id]/messages with an attachment', () => {
  it('forwards attachment + message_type + caption to the backend', async () => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ accessToken: 'token-1' });
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: {} }),
    });
    const attachment = {
      file: 'chat/attachments/42/a.jpg',
      file_name: 'IMG_1.HEIC',
      content_type: 'image/jpeg',
      size_bytes: 10,
    };

    await messagesPOST(
      postRequest('/api/ai-chat/trips/42/messages?language=en', {
        message_type: 'attachment',
        content: 'Our passports',
        attachment,
      }),
      ctx,
    );

    const [, init] = mockFetch.mock.calls[0];
    const sent = JSON.parse(init.body);
    expect(sent.message_type).toBe('attachment');
    expect(sent.content).toBe('Our passports');
    expect(sent.attachment).toEqual(attachment);
    expect(init.headers.Language).toBe('en');
  });
});
