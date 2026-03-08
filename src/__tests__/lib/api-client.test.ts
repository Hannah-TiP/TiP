import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/lib/api-client';

// Mock global fetch
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

describe('ApiClient.request (via public methods)', () => {
  it('sends Content-Type and credentials on every request', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: [] }));
    await apiClient.getCountries();

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/countries',
      expect.objectContaining({
        credentials: 'include',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }),
    );
  });

  it('throws on non-OK response with error message', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ message: 'Not found' }, 404));
    await expect(apiClient.getCurrentUser()).rejects.toThrow('Not found');
  });

  it('dispatches auth:unauthorized on 401', async () => {
    const handler = vi.fn();
    window.addEventListener('auth:unauthorized', handler);
    mockFetch.mockResolvedValueOnce(mockResponse({ message: 'Unauthorized' }, 401));

    await expect(apiClient.getCurrentUser()).rejects.toThrow();
    expect(handler).toHaveBeenCalled();
    window.removeEventListener('auth:unauthorized', handler);
  });
});

describe('login', () => {
  it('sends correct payload', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ token: 'abc' }));
    await apiClient.login('a@b.com', 'pass', 'device-1');

    const [, opts] = mockFetch.mock.calls[0];
    expect(opts.method).toBe('POST');
    expect(JSON.parse(opts.body)).toEqual({
      email: 'a@b.com',
      password: 'pass',
      device_id: 'device-1',
    });
  });
});

describe('register', () => {
  it('includes verification code and code_type', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ success: true }));
    await apiClient.register('a@b.com', 'pass', 'dev-1', '123456');

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.verification_code).toBe('123456');
    expect(body.code_type).toBe('register');
  });
});

describe('getHotels', () => {
  it('builds query params correctly', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: { items: [] } }));
    await apiClient.getHotels({ page: 2, per_page: 10, city_id: 5 });

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('page=2');
    expect(url).toContain('per_page=10');
    expect(url).toContain('city_id=5');
  });

  it('omits undefined params', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: { items: [] } }));
    await apiClient.getHotels({ page: 1 });

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('page=1');
    expect(url).not.toContain('city_id');
    expect(url).not.toContain('per_page');
  });

  it('calls /hotels with no params when none provided', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: { items: [] } }));
    await apiClient.getHotels();

    expect(mockFetch.mock.calls[0][0]).toBe('/api/hotels');
  });

  it('unwraps response.data.items', async () => {
    const hotels = [{ id: 1, name: 'Hotel A' }];
    mockFetch.mockResolvedValueOnce(mockResponse({ data: { items: hotels } }));

    const result = await apiClient.getHotels();
    expect(result).toEqual(hotels);
  });
});

describe('getTrips', () => {
  it('includes boolean params', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: { items: [] } }));
    await apiClient.getTrips({ exclude_canceled: true, status: 'active' });

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('exclude_canceled=true');
    expect(url).toContain('status=active');
  });
});

describe('converse', () => {
  it('includes widget_response when provided', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ reply: 'ok' }));
    await apiClient.converse('sess-1', 'hello', {
      type: 'date_picker',
      value: '2026-01-01',
    } as never);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.session_id).toBe('sess-1');
    expect(body.widget_response).toBeDefined();
  });

  it('omits widget_response when not provided', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ reply: 'ok' }));
    await apiClient.converse('sess-1', 'hello');

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.widget_response).toBeUndefined();
  });
});

describe('getMyReview', () => {
  it('returns null on error instead of throwing', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ message: 'Not found' }, 404));
    const result = await apiClient.getMyReview(99);
    expect(result).toBeNull();
  });
});
