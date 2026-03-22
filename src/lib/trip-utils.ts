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
