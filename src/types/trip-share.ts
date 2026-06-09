import type { QuoteWithVersion } from '@/types/quote';
import type { TripDocument, TripStatus, TripVersion } from '@/types/trip';

/**
 * Request body for `POST /api/v2/trips/{trip_id}/share`. Mirrors the backend
 * `ShareTripRequest` Pydantic model.
 */
export interface ShareTripRequest {
  emails: string[];
  show_cost: boolean;
  show_booking_documents: boolean;
}

/** Response of the share endpoint. Mirrors backend `ShareTripResponse`. */
export interface ShareTripResponse {
  shared_count: number;
  skipped_self: boolean;
  show_cost: boolean;
  show_booking_documents: boolean;
}

/** One entry in "shared with me". Mirrors backend `SharedTripItem`. */
export interface SharedTripItem {
  trip_id: number;
  status: TripStatus | string;
  title?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  adults: number;
  kids: number;
  summary?: string | null;
  show_cost: boolean;
  show_booking_documents: boolean;
  shared_by_email?: string | null;
  created_by_email?: string | null;
}

/** Read-only detail of a shared trip. Mirrors backend `SharedTripDetail`. */
export interface SharedTripDetail {
  trip_id: number;
  status: TripStatus | string;
  current_version?: TripVersion | null;
  show_cost: boolean;
  show_booking_documents: boolean;
  can_reshare: boolean;
  shared_by_email?: string | null;
  created_by_email?: string | null;
  active_quote?: QuoteWithVersion | null;
  booking_documents: TripDocument[];
}
