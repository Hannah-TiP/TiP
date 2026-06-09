import type { Trip, TripVersion } from '@/types/trip';

export type AIChatSessionStatus = 'ai' | 'human';
export type AIChatMessageRole = 'user' | 'assistant' | 'human_assistant' | 'system';
export type AIChatMessageType = 'text' | 'audio' | 'quote_sent';

export interface NumberStepperField {
  key: string;
  label: string;
  min?: number | null;
  max?: number | null;
  default?: number | null;
}

export interface OptionSelectorOption {
  value: string;
  label: string;
}

export interface DateRangePickerValue {
  start_date?: string | null;
  end_date?: string | null;
}

export interface NumberStepperValue {
  values: Record<string, number>;
}

export interface OptionSelectorValue {
  value: string;
}

export interface HotelCarouselSelection {
  hotel_id: number;
  name: string | null;
}

export interface HotelCarouselValue {
  // Single-pick shape (unchanged, backward compatible).
  hotel_id?: number | null;
  name?: string | null;
  // Multi-pick shape: present only when more than one hotel was selected.
  hotels?: HotelCarouselSelection[] | null;
}

export interface ActivityCarouselValue {
  activity_id?: number | null;
  name?: string | null;
}

export interface RestaurantCarouselValue {
  restaurant_id?: number | null;
  name?: string | null;
}

export interface AIChatDateRangePickerWidget {
  widget_id: string;
  widget_type: 'date_range_picker';
  min_date?: string | null;
  max_date?: string | null;
}

export interface AIChatNumberStepperWidget {
  widget_id: string;
  widget_type: 'number_stepper';
  fields: NumberStepperField[];
}

export interface AIChatOptionSelectorWidget {
  widget_id: string;
  widget_type: 'option_selector';
  label?: string | null;
  options: OptionSelectorOption[];
}

export interface HotelCarouselItem {
  id: number;
  name: string | null;
  image_url: string | null;
  overview: string | null;
  benefits: string[];
}

export interface AIChatHotelCarouselWidget {
  widget_id: string;
  widget_type: 'hotel_carousel';
  hotels: HotelCarouselItem[];
}

export interface ActivityCarouselItem {
  id: number;
  name: string | null;
  city_id?: number | null;
  city_name?: string | null;
  image_url: string | null;
  description: string | null;
  category: string | null;
  kind: string | null;
}

export interface AIChatActivityCarouselWidget {
  widget_id: string;
  widget_type: 'activity_carousel';
  activities: ActivityCarouselItem[];
}

export interface RestaurantCarouselItem {
  id: number;
  name: string | null;
  city_id?: number | null;
  city_name?: string | null;
  image_url: string | null;
  description: string | null;
  recognitions: string[];
}

export interface AIChatRestaurantCarouselWidget {
  widget_id: string;
  widget_type: 'restaurant_carousel';
  restaurants: RestaurantCarouselItem[];
}

/**
 * Concierge-emitted card linking the user to a freshly sent quote. Posted
 * as a side effect of the admin send-quote flow (not LLM-emitted).
 * `was_resent` is true when the same SENT quote is re-dispatched or when
 * a new quote supersedes an earlier SENT one for the same trip.
 */
export interface AIChatQuoteSentWidget {
  widget_id: string;
  widget_type: 'quote_sent';
  quote_id: number;
  sent_at: string;
  was_resent: boolean;
}

export type AIChatWidget =
  | AIChatDateRangePickerWidget
  | AIChatNumberStepperWidget
  | AIChatOptionSelectorWidget
  | AIChatHotelCarouselWidget
  | AIChatActivityCarouselWidget
  | AIChatRestaurantCarouselWidget
  | AIChatQuoteSentWidget;

export interface AIChatDateRangePickerWidgetResponse {
  widget_id: string;
  widget_type: 'date_range_picker';
  value: DateRangePickerValue;
}

export interface AIChatNumberStepperWidgetResponse {
  widget_id: string;
  widget_type: 'number_stepper';
  value: NumberStepperValue;
}

export interface AIChatOptionSelectorWidgetResponse {
  widget_id: string;
  widget_type: 'option_selector';
  value: OptionSelectorValue;
}

export interface AIChatHotelCarouselWidgetResponse {
  widget_id: string;
  widget_type: 'hotel_carousel';
  value: HotelCarouselValue;
}

export interface AIChatActivityCarouselWidgetResponse {
  widget_id: string;
  widget_type: 'activity_carousel';
  value: ActivityCarouselValue;
}

export interface AIChatRestaurantCarouselWidgetResponse {
  widget_id: string;
  widget_type: 'restaurant_carousel';
  value: RestaurantCarouselValue;
}

export type AIChatWidgetResponse =
  | AIChatDateRangePickerWidgetResponse
  | AIChatNumberStepperWidgetResponse
  | AIChatOptionSelectorWidgetResponse
  | AIChatHotelCarouselWidgetResponse
  | AIChatActivityCarouselWidgetResponse
  | AIChatRestaurantCarouselWidgetResponse;

export interface AIChatSessionMetadata {
  id: number;
  user_id: number;
  trip_id: number;
  status: AIChatSessionStatus;
  last_message_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

/**
 * A chat session bundled with its current trip row. Returned by the
 * `/ai-chat/sessions` list endpoint so the concierge sidebar can render
 * the trip-status badge for every session without N+1 trip fetches.
 */
export interface AIChatSessionWithTrip {
  session: AIChatSessionMetadata;
  trip: Trip;
}

export interface AIChatMessage {
  id: number;
  user_id: number;
  trip_id: number;
  role: AIChatMessageRole;
  message_type: AIChatMessageType;
  content?: string | null;
  media_url?: string | null;
  widget_response?: AIChatWidgetResponse | null;
  widgets?: AIChatWidget[] | null;
  sent_at?: string | null;
  // Backend audit field for HUMAN_ASSISTANT (admin takeover) messages. The
  // customer FE intentionally never renders this -- a generic "Concierge
  // Team" badge is shown instead. Kept in the type so other consumers don't
  // strip the field.
  created_by_admin_id?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface AIChatSessionResponse {
  success?: boolean;
  code?: number;
  data?: AIChatSessionMetadata;
}

export interface AIChatSessionsResponse {
  success?: boolean;
  code?: number;
  data?: AIChatSessionWithTrip[];
}

export interface AIChatMessagesResponse {
  success?: boolean;
  code?: number;
  data?: AIChatMessage[];
}

export interface SendAIChatMessageRequest {
  message_type?: AIChatMessageType;
  content?: string | null;
  media_url?: string | null;
  widget_response?: AIChatWidgetResponse | null;
  sent_at?: string | null;
  include_draft?: boolean;
}

export interface SendAIChatMessageData {
  user_message: AIChatMessage;
  assistant_message: AIChatMessage | null;
  trip: Trip | null;
  trip_version: TripVersion | null;
  field_updated: string[];
}

export interface SendAIChatMessageResponse {
  success?: boolean;
  code?: number;
  data?: SendAIChatMessageData;
}

export interface PendingMessage {
  content: string;
  widget_response: AIChatWidgetResponse | null;
  sent_at: string;
}

export interface RequestHumanResponse {
  session: AIChatSessionMetadata;
  assistant_message: AIChatMessage | null;
}

export interface S3UploadCredentialsResponse {
  success?: boolean;
  code?: number;
  data?: {
    upload_url: string;
    form_data: Record<string, string>;
    upload_key: string;
    bucket: string;
    region: string;
    public_url: string;
    restrictions: {
      max_file_size: string;
      allowed_types: string[];
      expiry_minutes: number;
      upload_method: string;
      access_level: string;
    };
  };
  upload_url?: string;
  form_data?: Record<string, string>;
  public_url?: string;
}
