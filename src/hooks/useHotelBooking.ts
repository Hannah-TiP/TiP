'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { apiClient } from '@/lib/api-client';
import { useLanguage } from '@/contexts/LanguageContext';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Translation keys this hook will surface as inline error messages.
 * Keep in lock-step with the corresponding entries in en.json + kr.json.
 */
export type BookingDateErrorKey =
  | 'hotel.booking_error_dates_required'
  | 'hotel.booking_error_check_out_after_check_in'
  | 'hotel.booking_error_check_in_in_past';

/**
 * Validate the hotel booking dates for the Reserve flow.
 * Returns a translation key for the first failing rule, or null if valid.
 */
export function validateBookingDates(
  checkIn: string,
  checkOut: string,
  today: Date = new Date(),
): BookingDateErrorKey | null {
  if (!checkIn || !checkOut || !ISO_DATE.test(checkIn) || !ISO_DATE.test(checkOut)) {
    return 'hotel.booking_error_dates_required';
  }
  // Strict greater-than: checkout must be after checkin.
  if (checkOut <= checkIn) {
    return 'hotel.booking_error_check_out_after_check_in';
  }
  // Compare YYYY-MM-DD lexicographically — same as date comparison.
  const todayIso = today.toISOString().slice(0, 10);
  if (checkIn < todayIso) {
    return 'hotel.booking_error_check_in_in_past';
  }
  return null;
}

/**
 * Build the sign-in redirect URL the user is bounced to when they click
 * Reserve / Ask Concierge while unauthenticated. After auth they land back
 * on the hotel page with `?reserve=1` (or `?ask=1`) plus dates so the
 * page can auto-fire the action.
 */
export function buildAuthCallbackUrl(
  hotelSlug: string,
  action: 'reserve' | 'ask',
  checkIn?: string,
  checkOut?: string,
): string {
  const params = new URLSearchParams();
  params.set(action === 'reserve' ? 'reserve' : 'ask', '1');
  if (checkIn) params.set('checkin', checkIn);
  if (checkOut) params.set('checkout', checkOut);
  return `/hotel/${hotelSlug}?${params.toString()}`;
}

interface UseHotelBookingArgs {
  hotelId: number | null;
  hotelSlug: string;
}

interface UseHotelBookingResult {
  reserve: (checkIn: string, checkOut: string) => Promise<void>;
  askConcierge: (checkIn?: string, checkOut?: string) => Promise<void>;
  dateError: string | null;
  apiError: string | null;
  clearErrors: () => void;
  isSubmitting: boolean;
}

/**
 * Single source of truth for the hotel page's Reserve and Ask Concierge
 * handlers. Both buttons in BookingCard and StickyBookingBar invoke this
 * hook so the validation, auth-gate, and API plumbing live in one place.
 */
export function useHotelBooking({
  hotelId,
  hotelSlug,
}: UseHotelBookingArgs): UseHotelBookingResult {
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const { t } = useLanguage();

  const [dateError, setDateError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearErrors = useCallback(() => {
    setDateError(null);
    setApiError(null);
  }, []);

  const redirectToSignIn = useCallback(
    (action: 'reserve' | 'ask', checkIn?: string, checkOut?: string) => {
      const callbackUrl = buildAuthCallbackUrl(hotelSlug, action, checkIn, checkOut);
      router.push(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    },
    [hotelSlug, router],
  );

  const reserve = useCallback(
    async (checkIn: string, checkOut: string) => {
      if (hotelId == null) return;
      clearErrors();

      const errorKey = validateBookingDates(checkIn, checkOut);
      if (errorKey) {
        setDateError(t(errorKey));
        return;
      }

      if (sessionStatus !== 'authenticated') {
        redirectToSignIn('reserve', checkIn, checkOut);
        return;
      }

      setIsSubmitting(true);
      try {
        const bundle = await apiClient.createTripFromHotel({
          hotel_id: hotelId,
          start_date: checkIn,
          end_date: checkOut,
        });
        router.push(`/concierge?trip_id=${bundle.trip.id}`);
      } catch (err) {
        console.error('Failed to create trip from hotel:', err);
        setApiError(t('hotel.booking_error_generic'));
      } finally {
        setIsSubmitting(false);
      }
    },
    [hotelId, sessionStatus, redirectToSignIn, router, clearErrors, t],
  );

  const askConcierge = useCallback(
    async (checkIn?: string, checkOut?: string) => {
      if (hotelId == null) return;
      clearErrors();

      if (sessionStatus !== 'authenticated') {
        redirectToSignIn('ask', checkIn, checkOut);
        return;
      }

      setIsSubmitting(true);
      try {
        const bundle = await apiClient.createTripFromHotel({
          hotel_id: hotelId,
          // Pass dates only when both are filled — partial dates would skew
          // the AI's first turn and the trip-version snapshot.
          ...(checkIn && checkOut ? { start_date: checkIn, end_date: checkOut } : {}),
        });
        router.push(`/concierge?trip_id=${bundle.trip.id}`);
      } catch (err) {
        console.error('Failed to create trip from hotel:', err);
        setApiError(t('hotel.booking_error_generic'));
      } finally {
        setIsSubmitting(false);
      }
    },
    [hotelId, sessionStatus, redirectToSignIn, router, clearErrors, t],
  );

  return { reserve, askConcierge, dateError, apiError, clearErrors, isSubmitting };
}
