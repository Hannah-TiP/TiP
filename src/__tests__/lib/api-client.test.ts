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
    await apiClient.login('a@b.com', 'pass');

    const [, opts] = mockFetch.mock.calls[0];
    expect(opts.method).toBe('POST');
    expect(JSON.parse(opts.body)).toEqual({
      email: 'a@b.com',
      password: 'pass',
    });
  });
});

describe('register', () => {
  it('includes verification code and code_type', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ success: true }));
    await apiClient.register('a@b.com', 'pass', '123456');

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.verification_code).toBe('123456');
    expect(body.code_type).toBe('register');
  });
});

describe('getHotels', () => {
  it('builds query params correctly', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: [] }));
    await apiClient.getHotels({ city_id: 5, language: 'en' });

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('city_id=5');
    expect(url).toContain('language=en');
  });

  it('omits undefined params', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: [] }));
    await apiClient.getHotels();

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).not.toContain('city_id');
    expect(url).not.toContain('language');
  });

  it('calls /hotels with no params when none provided', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: [] }));
    await apiClient.getHotels();

    expect(mockFetch.mock.calls[0][0]).toBe('/api/hotels');
  });

  it('unwraps response.data', async () => {
    const hotels = [{ id: 1, slug: 'hotel-a', status: 'published', schema_version: 1 }];
    mockFetch.mockResolvedValueOnce(mockResponse({ data: hotels }));

    const result = await apiClient.getHotels();
    expect(result).toEqual(hotels);
  });
});

describe('getHotelBySlug', () => {
  it('fetches the hotel detail by slug', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ data: { id: 1, slug: 'aman-tokyo', status: 'published', schema_version: 1 } }),
    );

    const result = await apiClient.getHotelBySlug('aman-tokyo');

    expect(mockFetch.mock.calls[0][0]).toBe('/api/hotels/aman-tokyo');
    expect(result.slug).toBe('aman-tokyo');
  });
});

describe('getRestaurants', () => {
  it('builds only supported query params and unwraps response.data', async () => {
    const restaurants = [{ id: 1, slug: 'noma', status: 'published', schema_version: 1 }];
    mockFetch.mockResolvedValueOnce(mockResponse({ data: restaurants }));

    const result = await apiClient.getRestaurants({ city_id: 7, language: 'en' });

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('/api/restaurants');
    expect(url).toContain('city_id=7');
    expect(url).toContain('language=en');
    expect(url).not.toContain('page=');
    expect(url).not.toContain('per_page=');
    expect(result).toEqual(restaurants);
  });
});

describe('getRestaurantBySlug', () => {
  it('fetches the restaurant detail by slug', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ data: { id: 1, slug: 'noma', status: 'published', schema_version: 1 } }),
    );

    const result = await apiClient.getRestaurantBySlug('noma');

    expect(mockFetch.mock.calls[0][0]).toBe('/api/restaurants/noma');
    expect(result.slug).toBe('noma');
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

describe('sendMessage', () => {
  it('sends trip_id and widget_response when provided', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({
        data: {
          user_message: { id: 1, trip_id: 7, user_id: 3, role: 'user', message_type: 'text' },
          assistant_message: null,
        },
      }),
    );
    await apiClient.sendMessage(7, {
      content: 'hello',
      widget_response: {
        widget_id: 'w1',
        widget_type: 'option_selector',
        value: { value: 'tokyo' },
      },
    });

    expect(mockFetch.mock.calls[0][0]).toBe('/api/ai-chat/trips/7/messages');
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.widget_response).toEqual({
      widget_id: 'w1',
      widget_type: 'option_selector',
      value: { value: 'tokyo' },
    });
  });

  it('omits widget_response when not provided', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({
        data: {
          user_message: { id: 1, trip_id: 7, user_id: 3, role: 'user', message_type: 'text' },
          assistant_message: null,
        },
      }),
    );
    await apiClient.sendMessage(7, { content: 'hello' });

    expect(mockFetch.mock.calls[0][0]).toBe('/api/ai-chat/trips/7/messages');
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.widget_response).toBeUndefined();
  });

  it('returns full response including trip, trip_version, and field_updated', async () => {
    const fullData = {
      user_message: { id: 1, trip_id: 7, user_id: 3, role: 'user', message_type: 'text' },
      assistant_message: { id: 2, trip_id: 7, user_id: 3, role: 'assistant', message_type: 'text' },
      trip: { id: 7, status: 'draft' },
      trip_version: { id: 1, trip_id: 7, adults: 2, kids: 0 },
      field_updated: ['destination', 'purpose'],
    };
    mockFetch.mockResolvedValueOnce(mockResponse({ success: true, data: fullData }));

    const result = await apiClient.sendMessage(7, { content: 'Plan Paris trip' });
    expect(result.data).toEqual(fullData);
    expect(result.data?.field_updated).toEqual(['destination', 'purpose']);
    expect(result.data?.trip).toEqual({ id: 7, status: 'draft' });
  });

  it('returns response with no data when backend omits it', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ success: true }));
    const result = await apiClient.sendMessage(7, { content: 'hello' });
    expect(result.data).toBeUndefined();
  });
});
