import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/lib/api-client';

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

describe('ApiClient.updateLanguagePreference', () => {
  it('POSTs { language_preference } to the profile/update proxy', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ success: true }));

    await apiClient.updateLanguagePreference('kr');

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/profile/update',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ language_preference: 'kr' }),
      }),
    );
  });

  it('forwards the en value too', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ success: true }));

    await apiClient.updateLanguagePreference('en');

    const [, options] = mockFetch.mock.calls[0];
    expect(JSON.parse(options.body as string)).toEqual({ language_preference: 'en' });
  });
});
