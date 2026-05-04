import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import {
  useHotelBooking,
  validateBookingDates,
  buildAuthCallbackUrl,
} from '@/hooks/useHotelBooking';
import { apiClient } from '@/lib/api-client';

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn() }),
}));

const sessionStatusRef: { current: 'authenticated' | 'unauthenticated' | 'loading' } = {
  current: 'authenticated',
};
vi.mock('next-auth/react', () => ({
  useSession: () => ({ status: sessionStatusRef.current, data: null }),
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    lang: 'en',
    setLang: () => {},
  }),
}));

beforeEach(() => {
  pushMock.mockClear();
  sessionStatusRef.current = 'authenticated';
});

// ── Pure validators ─────────────────────────────────────────────────────────

describe('validateBookingDates', () => {
  // Construct from local-time components (noon local) so the local-date
  // helper inside `validateBookingDates` reads as 2026-06-01 regardless of
  // the host's timezone. Using `new Date('2026-06-01T00:00:00Z')` would
  // shift the LOCAL date to 2026-05-31 anywhere west of UTC.
  const today = new Date(2026, 5, 1, 12, 0, 0);

  it('rejects missing dates', () => {
    expect(validateBookingDates('', '', today)).toBe('hotel.booking_error_dates_required');
    expect(validateBookingDates('2026-06-10', '', today)).toBe(
      'hotel.booking_error_dates_required',
    );
    expect(validateBookingDates('', '2026-06-13', today)).toBe(
      'hotel.booking_error_dates_required',
    );
  });

  it('rejects malformed dates', () => {
    expect(validateBookingDates('2026/06/10', '2026-06-13', today)).toBe(
      'hotel.booking_error_dates_required',
    );
  });

  it('rejects checkout earlier than or equal to checkin', () => {
    expect(validateBookingDates('2026-06-13', '2026-06-13', today)).toBe(
      'hotel.booking_error_check_out_after_check_in',
    );
    expect(validateBookingDates('2026-06-13', '2026-06-10', today)).toBe(
      'hotel.booking_error_check_out_after_check_in',
    );
  });

  it('rejects checkin in the past', () => {
    expect(validateBookingDates('2026-05-31', '2026-06-05', today)).toBe(
      'hotel.booking_error_check_in_in_past',
    );
  });

  it('accepts valid future dates', () => {
    expect(validateBookingDates('2026-06-10', '2026-06-13', today)).toBeNull();
    // Today as check-in is allowed.
    expect(validateBookingDates('2026-06-01', '2026-06-02', today)).toBeNull();
  });

  it('uses the local calendar date, not UTC, when comparing against today', () => {
    // Simulates 1am local on June 1 in UTC+9 (KST). UTC at this moment is
    // 16:00 on May 31. The OLD implementation (`toISOString().slice(0, 10)`)
    // would resolve `today` to "2026-05-31" and accept a check-in of
    // "2026-05-31" — a date that's already past locally. The new
    // implementation reads the LOCAL components and correctly rejects it.
    //
    // We reach the same condition in any timezone by constructing a Date
    // whose local components are "June 1, 2026 01:00:00". Whether the
    // host is in UTC, KST, or PST, `getFullYear/getMonth/getDate` always
    // return 2026/6/1.
    const earlyMorningLocal = new Date(2026, 5, 1, 1, 0, 0);
    expect(validateBookingDates('2026-05-31', '2026-06-05', earlyMorningLocal)).toBe(
      'hotel.booking_error_check_in_in_past',
    );
    // And of course June 1 itself is still allowed as today.
    expect(validateBookingDates('2026-06-01', '2026-06-05', earlyMorningLocal)).toBeNull();
  });

  it('uses the system clock when called without an explicit `today`', () => {
    // Mock the real `new Date()` to a specific local-time instant, then
    // make sure the validator picks that up. This verifies the default
    // argument path uses local-date components (not UTC).
    vi.useFakeTimers();
    try {
      // 11:30 PM local on June 1, 2026 — anywhere west of UTC the
      // OLD `toISOString().slice(0, 10)` would already read "2026-06-02",
      // wrongly REJECTING a "2026-06-02" check-in as in the past on
      // local June 1. The new implementation correctly accepts it.
      vi.setSystemTime(new Date(2026, 5, 1, 23, 30, 0));
      expect(validateBookingDates('2026-06-02', '2026-06-05')).toBeNull();
      expect(validateBookingDates('2026-06-01', '2026-06-05')).toBeNull();
      expect(validateBookingDates('2026-05-31', '2026-06-05')).toBe(
        'hotel.booking_error_check_in_in_past',
      );
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('buildAuthCallbackUrl', () => {
  it('encodes the reserve action with both dates', () => {
    const url = buildAuthCallbackUrl('ritz-paris', 'reserve', '2026-06-10', '2026-06-13');
    expect(url).toBe('/hotel/ritz-paris?reserve=1&checkin=2026-06-10&checkout=2026-06-13');
  });

  it('encodes the ask action without dates', () => {
    const url = buildAuthCallbackUrl('ritz-paris', 'ask');
    expect(url).toBe('/hotel/ritz-paris?ask=1');
  });

  it('omits absent dates', () => {
    const url = buildAuthCallbackUrl('ritz-paris', 'reserve', '2026-06-10');
    expect(url).toBe('/hotel/ritz-paris?reserve=1&checkin=2026-06-10');
  });
});

// ── Hook behaviour ──────────────────────────────────────────────────────────

describe('useHotelBooking — Reserve flow', () => {
  it('surfaces a date validation error and skips the API when dates are missing', async () => {
    const spy = vi.spyOn(apiClient, 'createTripFromHotel');

    const { result } = renderHook(() => useHotelBooking({ hotelId: 42, hotelSlug: 'ritz-paris' }));

    await act(async () => {
      await result.current.reserve('', '');
    });

    expect(result.current.dateError).toBe('hotel.booking_error_dates_required');
    expect(spy).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('redirects unauthed users to /sign-in?callbackUrl with reserve+dates', async () => {
    sessionStatusRef.current = 'unauthenticated';
    const spy = vi.spyOn(apiClient, 'createTripFromHotel');

    // Use far-future dates so the validator passes regardless of `today`.
    const { result } = renderHook(() => useHotelBooking({ hotelId: 42, hotelSlug: 'ritz-paris' }));

    await act(async () => {
      await result.current.reserve('2099-06-10', '2099-06-13');
    });

    expect(spy).not.toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledTimes(1);
    const target = pushMock.mock.calls[0][0] as string;
    expect(target.startsWith('/sign-in?callbackUrl=')).toBe(true);
    const decoded = decodeURIComponent(target.replace('/sign-in?callbackUrl=', ''));
    expect(decoded).toBe('/hotel/ritz-paris?reserve=1&checkin=2099-06-10&checkout=2099-06-13');
    spy.mockRestore();
  });

  it('calls the API and routes to /concierge when authed and dates are valid', async () => {
    const spy = vi.spyOn(apiClient, 'createTripFromHotel').mockResolvedValueOnce({
      trip: { id: 77 } as never,
      session: { id: 1 } as never,
      trip_version_id: 99,
    });

    const { result } = renderHook(() => useHotelBooking({ hotelId: 42, hotelSlug: 'ritz-paris' }));

    await act(async () => {
      await result.current.reserve('2099-06-10', '2099-06-13');
    });

    expect(spy).toHaveBeenCalledWith({
      hotel_id: 42,
      start_date: '2099-06-10',
      end_date: '2099-06-13',
    });
    expect(pushMock).toHaveBeenCalledWith('/concierge?trip_id=77');
    spy.mockRestore();
  });

  it('surfaces an API error when the backend rejects the request', async () => {
    const spy = vi
      .spyOn(apiClient, 'createTripFromHotel')
      .mockRejectedValueOnce(new Error('Hotel not found'));

    const { result } = renderHook(() => useHotelBooking({ hotelId: 42, hotelSlug: 'ritz-paris' }));

    await act(async () => {
      await result.current.reserve('2099-06-10', '2099-06-13');
    });

    await waitFor(() => expect(result.current.apiError).toBe('hotel.booking_error_generic'));
    expect(pushMock).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe('useHotelBooking — Ask Concierge flow', () => {
  it('redirects unauthed users with ?ask=1 and includes filled dates', async () => {
    sessionStatusRef.current = 'unauthenticated';
    const spy = vi.spyOn(apiClient, 'createTripFromHotel');

    const { result } = renderHook(() => useHotelBooking({ hotelId: 42, hotelSlug: 'ritz-paris' }));

    await act(async () => {
      await result.current.askConcierge('2099-06-10', '2099-06-13');
    });

    expect(spy).not.toHaveBeenCalled();
    const target = pushMock.mock.calls[0][0] as string;
    const decoded = decodeURIComponent(target.replace('/sign-in?callbackUrl=', ''));
    expect(decoded).toBe('/hotel/ritz-paris?ask=1&checkin=2099-06-10&checkout=2099-06-13');
    spy.mockRestore();
  });

  it('calls the API without dates when none are filled', async () => {
    const spy = vi.spyOn(apiClient, 'createTripFromHotel').mockResolvedValueOnce({
      trip: { id: 88 } as never,
      session: { id: 1 } as never,
      trip_version_id: 5,
    });

    const { result } = renderHook(() => useHotelBooking({ hotelId: 42, hotelSlug: 'ritz-paris' }));

    await act(async () => {
      await result.current.askConcierge();
    });

    expect(spy).toHaveBeenCalledWith({ hotel_id: 42 });
    expect(pushMock).toHaveBeenCalledWith('/concierge?trip_id=88');
    spy.mockRestore();
  });

  it('passes through dates when both are filled even on the ask flow', async () => {
    const spy = vi.spyOn(apiClient, 'createTripFromHotel').mockResolvedValueOnce({
      trip: { id: 88 } as never,
      session: { id: 1 } as never,
      trip_version_id: 5,
    });

    const { result } = renderHook(() => useHotelBooking({ hotelId: 42, hotelSlug: 'ritz-paris' }));

    await act(async () => {
      await result.current.askConcierge('2099-06-10', '2099-06-13');
    });

    expect(spy).toHaveBeenCalledWith({
      hotel_id: 42,
      start_date: '2099-06-10',
      end_date: '2099-06-13',
    });
    spy.mockRestore();
  });
});
