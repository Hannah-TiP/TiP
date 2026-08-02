import { apiClient } from '@/lib/api-client';
import type { Lang } from '@/contexts/LanguageContext';
import type { Quote } from '@/types/quote';
import type { Trip, TripDocument, TripPlanItem, TripVersion } from '@/types/trip';
import type { ReviewEntityType } from '@/types/review';

/**
 * A TiP-DB-backed itinerary item that can be reviewed, flattened to the
 * fields the review session needs: the entity type/id (the review target)
 * plus a display title. Free-text items without an entity id are excluded
 * upstream by `getTripReviewableItems`.
 */
export interface ReviewableEntity {
  entityType: ReviewEntityType;
  entityId: number;
  title: string;
}

export function toReviewableEntities(items: TripPlanItem[]): ReviewableEntity[] {
  const entities: ReviewableEntity[] = [];
  for (const item of items) {
    if (item.item_type === 'hotel' && item.hotel_id) {
      entities.push({ entityType: 'hotel', entityId: item.hotel_id, title: item.title || 'Hotel' });
    } else if (item.item_type === 'restaurant' && item.restaurant_id) {
      entities.push({
        entityType: 'restaurant',
        entityId: item.restaurant_id,
        title: item.title || 'Restaurant',
      });
    } else if (item.item_type === 'activity' && item.activity_id) {
      entities.push({
        entityType: 'activity',
        entityId: item.activity_id,
        title: item.title || 'Activity',
      });
    }
  }
  // De-duplicate: an entity can appear on multiple itinerary days but maps
  // to a single (user, trip, item) review.
  const seen = new Set<string>();
  return entities.filter((e) => {
    const key = `${e.entityType}:${e.entityId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export interface TripWithVersion {
  trip: Trip;
  currentVersion: TripVersion | null;
  // The single active (SENT) quote for the trip, if any. Comes through
  // `GET /trip/{id}` as `TripWithActiveQuote` -- we surface it on the FE
  // bundle so the concierge right pane can render a payment CTA.
  activeQuote: Quote | null;
}

export async function getTripWithVersion(id: number, language?: Lang): Promise<TripWithVersion> {
  const [bundle, currentVersion] = await Promise.all([
    apiClient.getTripById(id, language),
    apiClient.getCurrentTripVersion(id, language).catch(() => null),
  ]);

  return { trip: bundle.trip, currentVersion, activeQuote: bundle.active_quote };
}

export async function getTripsWithVersions(params?: {
  status?: string;
  page?: number;
  per_page?: number;
  exclude_canceled?: boolean;
  language?: Lang;
}): Promise<TripWithVersion[]> {
  const trips = await apiClient.getTrips(params);
  return Promise.all(
    trips.map(async (trip) => ({
      trip,
      currentVersion: trip.current_trip_version_id
        ? await apiClient.getCurrentTripVersion(trip.id, params?.language).catch(() => null)
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
