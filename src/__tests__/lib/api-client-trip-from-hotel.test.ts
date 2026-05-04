import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/lib/api-client';
import type { CreateTripFromHotelResponse } from '@/types/trip';

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

describe('apiClient.createTripFromHotel', () => {
  it('POSTs /api/trips/from-hotel with the full payload and unwraps `data`', async () => {
    const bundle: CreateTripFromHotelResponse = {
      trip: {
        id: 77,
        user_id: 11,
        status: 'draft',
        current_trip_version_id: 99,
        schema_version: 1,
      },
      session: {
        id: 1,
        user_id: 11,
        trip_id: 77,
        status: 'ai',
      },
      trip_version_id: 99,
    };
    mockFetch.mockResolvedValueOnce(mockResponse({ data: bundle }));

    const result = await apiClient.createTripFromHotel({
      hotel_id: 42,
      start_date: '2026-06-10',
      end_date: '2026-06-13',
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/trips/from-hotel');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({
      hotel_id: 42,
      start_date: '2026-06-10',
      end_date: '2026-06-13',
    });
    expect(result).toEqual(bundle);
  });

  it('omits dates when caller does not supply them (Ask Concierge case)', async () => {
    const bundle: CreateTripFromHotelResponse = {
      trip: {
        id: 88,
        user_id: 11,
        status: 'draft',
        current_trip_version_id: 100,
        schema_version: 1,
      },
      session: {
        id: 2,
        user_id: 11,
        trip_id: 88,
        status: 'ai',
      },
      trip_version_id: 100,
    };
    mockFetch.mockResolvedValueOnce(mockResponse({ data: bundle }));

    await apiClient.createTripFromHotel({ hotel_id: 42 });

    const init = mockFetch.mock.calls[0][1];
    expect(JSON.parse(init.body as string)).toEqual({ hotel_id: 42 });
  });

  it('throws the backend error message on non-OK response', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ message: 'Hotel not found' }, 404));
    await expect(apiClient.createTripFromHotel({ hotel_id: 9999 })).rejects.toThrow(
      'Hotel not found',
    );
  });

  it('dispatches auth:unauthorized on 401', async () => {
    const handler = vi.fn();
    window.addEventListener('auth:unauthorized', handler);
    mockFetch.mockResolvedValueOnce(mockResponse({ message: 'Unauthorized' }, 401));

    await expect(apiClient.createTripFromHotel({ hotel_id: 42 })).rejects.toThrow();
    expect(handler).toHaveBeenCalled();
    window.removeEventListener('auth:unauthorized', handler);
  });
});
