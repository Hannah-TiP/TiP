import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/lib/api-client';
import { ApiError } from '@/lib/api-error';

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubResponse(status: number, body: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: false,
      status,
      json: () =>
        body === undefined ? Promise.reject(new Error('no json')) : Promise.resolve(body),
    }),
  );
}

describe('apiClient error envelope', () => {
  it('throws ApiError carrying the v2 envelope message and status', async () => {
    stubResponse(422, { code: 4220, message: '파일을 처리할 수 없습니다.' });
    const err = await apiClient
      .finalizeChatAttachment(1, { s3_key: 'k', file_name: 'a.pdf' })
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).message).toBe('파일을 처리할 수 없습니다.');
    expect((err as ApiError).status).toBe(422);
  });

  it('throws a plain Error when the response has no message', async () => {
    stubResponse(502, undefined);
    const err = await apiClient
      .getChatAttachmentUploadCredentials(1, { content_type: 'image/jpeg' })
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(Error);
    expect(err).not.toBeInstanceOf(ApiError);
    expect((err as Error).message).toBe('Request failed');
  });
});
