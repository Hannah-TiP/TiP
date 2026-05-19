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

describe('apiClient.getActivities', () => {
  it('forwards kind=local_experience as a query param', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: [] }));
    await apiClient.getActivities({ kind: 'local_experience', language: 'en' });

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('kind=local_experience');
    expect(url).toContain('language=en');
  });

  it('forwards kind=package as a query param', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: [] }));
    await apiClient.getActivities({ kind: 'package', language: 'en' });

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('kind=package');
  });

  it('omits kind when not provided', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: [] }));
    await apiClient.getActivities({ language: 'en' });

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).not.toContain('kind=');
  });

  it('combines kind with city_id and include_draft', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: [] }));
    await apiClient.getActivities({
      kind: 'package',
      city_id: 7,
      include_draft: true,
      language: 'en',
    });

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('kind=package');
    expect(url).toContain('city_id=7');
    expect(url).toContain('include_draft=true');
  });

  it('unwraps response.data into Activity[]', async () => {
    const activities = [
      {
        id: 1,
        slug: 'ritz-yacht',
        kind: 'package',
        status: 'published',
        schema_version: 1,
      },
    ];
    mockFetch.mockResolvedValueOnce(mockResponse({ data: activities }));

    const result = await apiClient.getActivities({ kind: 'package' });
    expect(result).toEqual(activities);
  });
});
