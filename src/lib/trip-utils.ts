import { apiClient } from '@/lib/api-client';
import type { Quote } from '@/types/quote';
import type { Trip, TripDocument, TripPlanItem, TripVersion } from '@/types/trip';

export interface TripWithVersion {
  trip: Trip;
  currentVersion: TripVersion | null;
  // The single active (SENT) quote for the trip, if any. Comes through
  // `GET /trip/{id}` as `TripWithActiveQuote` -- we surface it on the FE
  // bundle so the concierge right pane can render a payment CTA.
  activeQuote: Quote | null;
}

export async function getTripWithVersion(id: number): Promise<TripWithVersion> {
  const [bundle, currentVersion] = await Promise.all([
    apiClient.getTripById(id),
    apiClient.getCurrentTripVersion(id).catch(() => null),
  ]);

  return { trip: bundle.trip, currentVersion, activeQuote: bundle.active_quote };
}

export async function getTripsWithVersions(params?: {
  status?: string;
  page?: number;
  per_page?: number;
  exclude_canceled?: boolean;
}): Promise<TripWithVersion[]> {
  const trips = await apiClient.getTrips(params);
  return Promise.all(
    trips.map(async (trip) => ({
      trip,
      currentVersion: trip.current_trip_version_id
        ? await apiClient.getCurrentTripVersion(trip.id).catch(() => null)
        : null,
      // `GET /trips` returns bare Trip rows (list shape). Don't fan out N+1
      // active-quote lookups here -- the concierge right pane fetches the
      // bundle for the *active* trip only via getTripWithVersion above.
      activeQuote: null,
    })),
  );
}

export function collectTripDocuments(currentVersion?: TripVersion | null): TripDocument[] {
  const plan = currentVersion?.plan;
  if (!plan || plan.length === 0) return [];

  return plan.flatMap((day) => day.items.flatMap((item) => item.documents || []));
}

export function getTripReviewableItems(currentVersion?: TripVersion | null): TripPlanItem[] {
  const plan = currentVersion?.plan;
  if (!plan || plan.length === 0) return [];

  return plan.flatMap((day) =>
    day.items.filter(
      (item) =>
        (item.item_type === 'hotel' && !!item.hotel_id) ||
        (item.item_type === 'restaurant' && !!item.restaurant_id) ||
        (item.item_type === 'activity' && !!item.activity_id),
    ),
  );
}

/** Parse "YYYY-MM-DD" as local date (avoids UTC midnight → previous day in western timezones). */
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Day number relative to a trip's start (start = 1). Use this when rendering
 * "Day N" labels — the plan list is sparse (only days with items), so a
 * positional index is unreliable.
 *
 * Math.round on the ms delta absorbs DST transitions that nudge the diff by
 * ±1 hour. Returns null if either date is missing/empty so callers can
 * suppress the badge instead of falling back to a wrong value.
 */
export function tripDayNumber(
  dayDateStr: string | null | undefined,
  startDateStr: string | null | undefined,
): number | null {
  if (!dayDateStr || !startDateStr) return null;
  const start = parseLocalDate(startDateStr);
  const day = parseLocalDate(dayDateStr);
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.round((day.getTime() - start.getTime()) / MS_PER_DAY) + 1;
}
