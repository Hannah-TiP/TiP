import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/lib/api-client';
import type { DeleteAccountResponse } from '@/types/auth';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function mockResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  };
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe('apiClient.deleteAccount', () => {
  const responseData: DeleteAccountResponse = {
    deletion_requested_at: '2026-07-30T09:00:00Z',
    purge_after: '2026-08-29T09:00:00Z',
  };

  it('POSTs /api/me/delete with the password re-auth shape and unwraps `data`', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: responseData }));

    const result = await apiClient.deleteAccount({ password: 'hunter22' }, 'en');

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/me/delete?language=en',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ password: 'hunter22' }),
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }),
    );
    expect(result).toEqual(responseData);
  });

  it('POSTs the verification_code re-auth shape for social-only accounts', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: responseData }));

    await apiClient.deleteAccount({ verification_code: '123456' }, 'kr');

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/me/delete?language=kr',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ verification_code: '123456' }),
      }),
    );
  });

  it('throws the backend error message on a 4xx response', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ success: false, message: 'Current password is incorrect' }, 400),
    );

    await expect(apiClient.deleteAccount({ password: 'wrong' })).rejects.toThrow(
      'Current password is incorrect',
    );
  });

  it('dispatches auth:unauthorized on 401', async () => {
    const handler = vi.fn();
    window.addEventListener('auth:unauthorized', handler);
    mockFetch.mockResolvedValueOnce(mockResponse({ message: 'Unauthorized' }, 401));

    await expect(apiClient.deleteAccount({ password: 'x' })).rejects.toThrow();
    expect(handler).toHaveBeenCalled();
    window.removeEventListener('auth:unauthorized', handler);
  });
});

describe('apiClient.sendVerificationCode', () => {
  it.each(['register', 'forgot-password', 'account_deletion'] as const)(
    'passes code_type "%s" through verbatim',
    async (type) => {
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true }));

      await apiClient.sendVerificationCode('user@example.com', type);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/auth/send-verification',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'user@example.com', code_type: type }),
        }),
      );
    },
  );
});
