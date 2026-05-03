import { apiClient } from '@/lib/api-client';
import type { Trip, TripDocument, TripPlanItem, TripVersion } from '@/types/trip';

export interface TripWithVersion {
  trip: Trip;
  currentVersion: TripVersion | null;
}

export async function getTripWithVersion(id: number): Promise<TripWithVersion> {
  const [trip, currentVersion] = await Promise.all([
    apiClient.getTripById(id),
    apiClient.getCurrentTripVersion(id).catch(() => null),
  ]);

  return { trip, currentVersion };
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
