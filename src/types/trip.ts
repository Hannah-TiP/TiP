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

export interface Coupon {
  id: number;
  code: string;
  amount: number;
  membership: string;
  end_date: number;      // unix timestamp
  is_active: boolean;
}

export interface TravelPlanItem {
  id: number;
  trip_id: number;
  travel_plan_id: number;
  category_type?: string;          // "flight" | "staying" | "activities" | "others"
  category_name?: string;
  estimated_cost?: number;
  city?: string;
  location?: string;
  lat?: number;
  lng?: number;
  timezone?: string;
  start_time?: string;             // display time string
  start_time_timestamp?: number;   // unix timestamp
  description?: string;
  system_hotel_id?: number;
  system_activity_id?: number;
  review_summary?: { total_reviews: number; average_rating: number };
  user_review_status?: string;     // "none" | "pending-review" | "published" | "rejected"
  user_rating?: number;
  total_reviewers?: number;
}

export interface TravelPlan {
  id: number;
  trip_id: number;
  proposal_id: number;
  sort: number;           // day order (1, 2, 3…)
  date: number;           // unix timestamp for that day
  day_topic?: string;
  cover?: string;
  items: TravelPlanItem[];
}

export interface Proposal {
  id: number;
  trip_id: number;
  language: string;
  preset_destination_cities?: string;
  preset_destination_cities_names?: string;
  custom_destination_cities?: string;
  start_time?: number;
  end_time?: number;
  adults: number;
  kids: number;
  purpose: string;
  flight_cost?: number;
  staying_cost?: number;
  activity_cost?: number;
  other_cost?: number;
  coupon_cost?: number;
  total_cost?: number;
  note?: string;
  // travel_plans are NOT here — they live at the Trip level
}

export interface ProposalComment {
  id: number;
  trip_id: number;
  user_id?: number;
  admin_id?: number;
  content?: Array<{
    role: 'user' | 'admin';
    type: 'text' | 'file';
    message: string;
    filePath?: string;
  }>;
  user_unread_count: number;
  admin_unread_count: number;
}

// List response — GET /api/v1/trip/list
export interface Trip {
  id: number;
  user_id: number;
  destination?: string;                     // AI chat context convenience field only
  cover_image?: string;
  preset_destination_cities?: string;       // comma-separated city IDs
  preset_destination_cities_names?: string; // comma-separated city names e.g. "Paris, Lyon"
  custom_destination_cities?: string;
  start_time?: number;                      // unix timestamp (legacy)
  end_time?: number;                        // unix timestamp (legacy)
  start_date?: string;                      // YYYY-MM-DD (prefer this)
  end_date?: string;                        // YYYY-MM-DD
  timezone?: string;                        // UTC offset e.g. "+08:00"
  adults: number;
  kids: number;
  purpose: string;
  service_type?: string;
  flight_options?: string[];
  additional_services?: string[];
  start_city?: string;
  accommodation_preferences?: string;
  specific_hotel_requests?: string;
  preferences?: string;
  budget?: number;
  coupon_id?: number;
  coupon?: Coupon;
  status: TripStatus | string;
  proposal_status?: string;
  has_comments: boolean;
  is_shared?: boolean;
  show_cost?: boolean;
  show_booking_documents?: boolean;
  has_unread_journal_messages?: boolean;
}

// Detail response — GET /api/v1/trip/{id}
// Extends Trip with proposal, itinerary, payment, and sharing fields
export interface TripDetail extends Trip {
  user_email?: string;
  tickets?: Array<{ file: string; fileName: string }>;
  share_image_no_cost?: string;
  share_image_with_cost?: string;
  share_pdf?: string;
  paid_amount?: number;
  pending_amount?: number;
  proposal?: Proposal;
  travel_plans?: TravelPlan[];    // one per day; at trip level, NOT inside proposal
  comments?: ProposalComment;
}
