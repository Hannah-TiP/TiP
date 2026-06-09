import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/lib/api-client';
import type { ShareTripResponse, SharedTripDetail, SharedTripItem } from '@/types/trip-share';

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

describe('apiClient.shareTrip', () => {
  it('POSTs /api/trip/{id}/share with the payload and unwraps `data`', async () => {
    const result: ShareTripResponse = {
      shared_count: 2,
      skipped_self: false,
      show_cost: true,
      show_booking_documents: false,
    };
    mockFetch.mockResolvedValueOnce(mockResponse({ data: result }));

    const out = await apiClient.shareTrip(55, {
      emails: ['a@example.com', 'b@example.com'],
      show_cost: true,
      show_booking_documents: false,
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/trip/55/share');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({
      emails: ['a@example.com', 'b@example.com'],
      show_cost: true,
      show_booking_documents: false,
    });
    expect(out).toEqual(result);
  });

  it('throws the backend message on a 403 (no reshare permission)', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ message: "You don't have permission to share this trip." }, 403),
    );
    await expect(
      apiClient.shareTrip(55, {
        emails: ['x@example.com'],
        show_cost: true,
        show_booking_documents: true,
      }),
    ).rejects.toThrow(/permission/);
  });
});

describe('apiClient.getSharedTrips', () => {
  it('GETs /api/me/shared-trips and unwraps the list', async () => {
    const items: SharedTripItem[] = [
      {
        trip_id: 9,
        status: 'waiting-for-proposal',
        title: 'Paris',
        adults: 2,
        kids: 0,
        show_cost: true,
        show_booking_documents: true,
        created_by_email: 'owner@example.com',
      },
    ];
    mockFetch.mockResolvedValueOnce(mockResponse({ data: items }));

    const out = await apiClient.getSharedTrips();
    expect(mockFetch.mock.calls[0][0]).toBe('/api/me/shared-trips');
    expect(out).toEqual(items);
  });
});

describe('apiClient.getSharedTripDetail', () => {
  it('GETs /api/shared-trips/{id} and unwraps the detail', async () => {
    const detail: SharedTripDetail = {
      trip_id: 9,
      status: 'paid',
      current_version: null,
      show_cost: false,
      show_booking_documents: true,
      can_reshare: true,
      active_quote: null,
      booking_documents: [],
    };
    mockFetch.mockResolvedValueOnce(mockResponse({ data: detail }));

    const out = await apiClient.getSharedTripDetail(9);
    expect(mockFetch.mock.calls[0][0]).toBe('/api/shared-trips/9');
    expect(out).toEqual(detail);
  });

  it('throws on 403 for a non-recipient', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ message: "You don't have access to this trip." }, 403),
    );
    await expect(apiClient.getSharedTripDetail(9)).rejects.toThrow(/access/);
  });
});
