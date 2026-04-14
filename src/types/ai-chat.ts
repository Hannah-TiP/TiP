export type AIChatSessionStatus = 'ai' | 'human';
export type AIChatMessageRole = 'user' | 'assistant' | 'human_assistant' | 'system';
export type AIChatMessageType = 'text' | 'audio';

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

export interface HotelCarouselValue {
  hotel_id?: number | null;
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

export interface AIChatHotelCarouselWidget {
  widget_id: string;
  widget_type: 'hotel_carousel';
  hotel_ids: number[];
}

export type AIChatWidget =
  | AIChatDateRangePickerWidget
  | AIChatNumberStepperWidget
  | AIChatOptionSelectorWidget
  | AIChatHotelCarouselWidget;

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

export type AIChatWidgetResponse =
  | AIChatDateRangePickerWidgetResponse
  | AIChatNumberStepperWidgetResponse
  | AIChatOptionSelectorWidgetResponse
  | AIChatHotelCarouselWidgetResponse;

export interface AIChatSessionMetadata {
  id: number;
  user_id: number;
  trip_id: number;
  status: AIChatSessionStatus;
  session_id?: string | null;
  last_message_at?: string | null;
  schema_version: number;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface AIChatMessageMetadata {
  ui_blocks?: UIBlock[] | null;
  field_updated?: string[] | null;
  widget_response?: WidgetResponse | null;
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
  message_metadata?: AIChatMessageMetadata | null;
  sent_at?: string | null;
  schema_version: number;
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
  data?: AIChatSessionMetadata[];
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
}

export interface SendAIChatMessageData {
  user_message: AIChatMessage;
  assistant_message: AIChatMessage | null;
}

export interface SendAIChatMessageResponse {
  success?: boolean;
  code?: number;
  data?: SendAIChatMessageData;
}

// ── /converse endpoint (Enhanced AI Chat v2) ──────────────────────────────

export type UIBlockType =
  | 'date_range_picker'
  | 'number_stepper'
  | 'option_selector'
  | 'hotel_carousel'
  | 'confirm_summary';

export interface DateRangePickerConfig {
  min_date?: string | null;
  max_date?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}

export interface NumberStepperConfigField {
  key: string;
  label: string;
  min?: number | null;
  max?: number | null;
  default?: number | null;
}

export interface NumberStepperConfig {
  fields: NumberStepperConfigField[];
}

export interface OptionSelectorConfig {
  options: OptionSelectorOption[];
}

export interface HotelCarouselConfig {
  hotels: Array<{
    id: number;
    name?: unknown;
    star_rating?: string | number | null;
    images?: unknown[];
    address?: unknown;
    [key: string]: unknown;
  }>;
}

export type UIBlockConfig =
  | DateRangePickerConfig
  | NumberStepperConfig
  | OptionSelectorConfig
  | HotelCarouselConfig
  | Record<string, unknown>;

export interface UIBlock {
  type: UIBlockType | string;
  id: string;
  label: string;
  config: UIBlockConfig;
}

export interface WidgetResponse {
  widget_id: string;
  widget_type: UIBlockType | string;
  value: Record<string, unknown>;
}

export interface ConverseRequest {
  session_id: string;
  content?: string;
  message_type?: AIChatMessageType;
  widget_response?: WidgetResponse | null;
}

export interface ConverseResponse {
  session_id: string;
  response: string;
  trip: Record<string, unknown>;
  ui_blocks: UIBlock[];
  field_updated: string[];
  user_message_id?: number | null;
  assistant_message_id?: number | null;
}

export interface ConverseApiResponse {
  success?: boolean;
  code?: number;
  data?: ConverseResponse;
  message?: string;
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
