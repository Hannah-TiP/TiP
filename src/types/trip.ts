import type { GeoPoint } from '@/types/common';

export type TripStatus =
  | 'draft'
  | 'waiting-for-proposal'
  | 'in-progress'
  | 'waiting-for-payment'
  | 'paid'
  | 'ready-to-travel'
  | 'traveling-now'
  | 'travel-completed'
  | 'canceled';

export type InternalNoteStatus = 'active' | 'archived';

export interface TripDocument {
  document_type?: string | null;
  file: string;
  file_name?: string | null;
  booking_reference?: string | null;
}

export interface TripInternalNote {
  id: number;
  trip_id: number;
  content: string;
  status: InternalNoteStatus;
  created_by_admin_id?: number | null;
  schema_version: number;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface TripPlanItemBase {
  item_type: 'flight' | 'hotel' | 'restaurant' | 'activity' | 'transfer' | 'note';
  title?: string | null;
  description?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  location?: string | null;
  geo?: GeoPoint | null;
  documents?: TripDocument[] | null;
}

export interface FlightPlanItem extends TripPlanItemBase {
  item_type: 'flight';
  carrier?: string | null;
  flight_number?: string | null;
  departure_airport?: string | null;
  arrival_airport?: string | null;
}

export interface HotelPlanItem extends TripPlanItemBase {
  item_type: 'hotel';
  hotel_id?: number | null;
}

export interface RestaurantPlanItem extends TripPlanItemBase {
  item_type: 'restaurant';
  restaurant_id?: number | null;
}

export interface ActivityPlanItem extends TripPlanItemBase {
  item_type: 'activity';
  activity_id?: number | null;
}

export interface TransferPlanItem extends TripPlanItemBase {
  item_type: 'transfer';
  transport_type?: string | null;
}

export interface NotePlanItem extends TripPlanItemBase {
  item_type: 'note';
}

export type TripPlanItem =
  | FlightPlanItem
  | HotelPlanItem
  | RestaurantPlanItem
  | ActivityPlanItem
  | TransferPlanItem
  | NotePlanItem;

export interface TripDay {
  date: string;
  title?: string | null;
  items: TripPlanItem[];
}

export interface TripVersion {
  id?: number | null;
  trip_id: number;
  version_number?: number | null;
  created_by_admin_id?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  title?: string | null;
  summary?: string | null;
  adults: number;
  kids: number;
  plan?: TripDay[] | null;
  schema_version: number;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Trip {
  id: number;
  user_id: number;
  status: TripStatus | string;
  current_trip_version_id?: number | null;
  schema_version: number;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface TripFromHotelBundle {
  trip: Trip;
  session: {
    id: number;
    user_id: number;
    trip_id: number;
    status: string;
    last_message_at?: string | null;
    schema_version: number;
    created_at?: string | null;
    updated_at?: string | null;
  };
  trip_version_id: number;
}
