// AI Chat types matching backend API response structure

export type IntentType = 'query_trips' | 'create_trip' | 'edit_trip' | 'upcoming_trips' | 'general';
export type MessageRole = 'user' | 'assistant' | 'system';
export type MessageType = 'text' | 'image' | 'audio';
export type CollectionStatus = 'collecting' | 'collecting_optional' | 'awaiting_confirmation' | 'completed';

export interface Trip {
  id: number;
  destination: string;
  cover_image?: string;
  start_date: string;
  end_date: string;
  start_time: number; // Unix timestamp
  end_time: number;
  adults: number;
  kids?: number;
  purpose?: string;
  status: 'draft' | 'waiting-for-proposal' | 'paid' | 'completed';
  budget?: number;
  service_type?: string;
  preset_destination_cities?: string;
  custom_destination_cities?: string;
  has_comments: boolean;
  is_shared: boolean;
}

export interface TripContext {
  destination?: string;
  start_date?: string;
  end_date?: string;
  adults?: number;
  kids?: number;
  purpose?: string;
  budget?: number;
  service_type?: string;
  [key: string]: unknown;
}

export interface MessageMetadata {
  // For trip-related messages
  intent?: IntentType;
  trips?: Trip[];
  has_trips?: boolean;
  has_active_trip_creation?: boolean;

  // For trip creation messages
  collection_status?: CollectionStatus;
  next_field?: string;
  trip_summary?: TripContext;
  trip_context?: TripContext;
  trip_created?: boolean;
  trip_id?: number;
  trip?: Trip;

  // For image messages
  width?: number;
  height?: number;
  analysis_requested?: boolean;
  analysis_result?: {
    landmark?: string;
    location?: string;
    description?: string;
  };

  // For audio messages
  duration?: number;
  transcription?: string;
}

export interface AIMessage {
  id: number;
  session_id: string;
  role: MessageRole;
  content: string;
  message_type: MessageType;
  media_url?: string;
  message_metadata?: MessageMetadata;
  created_at: string;
  updated_at?: string;
}

export interface AISession {
  session_id: string;
  chat_history: Array<{
    role: MessageRole;
    content: string;
  }>;
  status: string;
  language: string;
}

export interface CreateSessionResponse {
  success?: boolean;
  code?: number;
  data?: AISession;
}

export interface SendMessageRequest {
  session_id: string;
  content: string;
  message_type: MessageType;
}

export interface SendMessageResponse {
  success?: boolean;
  code?: number;
  data?: {
    session_id: string;
    response: string;
    intent?: IntentType;
    trips?: Trip[];
    has_trips?: boolean;
    collection_status?: CollectionStatus;
    next_field?: string;
    trip_context?: TripContext;
    trip_created?: boolean;
    trip_id?: number;
    trip?: Trip;
  };
}

export interface ChatHistoryResponse {
  success?: boolean;
  code?: number;
  data?: {
    messages: AIMessage[];
    total: number;
    page: number;
    per_page: number;
    has_more: boolean;
  };
}

export interface UploadImageRequest {
  session_id: string;
  image: File;
}

export interface UploadImageResponse {
  success: boolean;
  data: {
    response: string;
    session_id: string;
    media_url: string;
    analysis_result?: {
      landmark?: string;
      location?: string;
      description?: string;
    };
  };
}

export interface UploadAudioRequest {
  session_id: string;
  audio: File;
}

export interface UploadAudioResponse {
  success: boolean;
  data: {
    response: string;
    session_id: string;
    media_url: string;
    transcription: string;
  };
}

// New S3 Direct Upload Types
export interface S3UploadCredentialsResponse {
  success?: boolean;
  code?: number;
  data?: {
    upload_url: string;
    form_data: Record<string, string>;
    upload_key: string;
    bucket: string;
    region: string;
    public_url: string; // The actual media URL to use
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

export interface AnalyzeImageRequest {
  session_id: string;
  media_url: string;
  width?: number;
  height?: number;
  filename?: string;
}

export interface AnalyzeImageResponse {
  success?: boolean;
  code?: number;
  data?: {
    response: string;
    analysis_result?: string;
    session_id: string;
    intent: IntentType;
    trips?: Trip[];
    has_trips?: boolean;
    message_metadata?: MessageMetadata;
  };
}

export interface TranscribeAudioRequest {
  session_id: string;
  media_url: string;
  duration?: number;
  filename?: string;
}

export interface TranscribeAudioResponse {
  success?: boolean;
  code?: number;
  data?: {
    response: string;
    transcription: string;
    session_id: string;
    intent: IntentType;
    trips?: Trip[];
    has_trips?: boolean;
    message_metadata?: MessageMetadata;
  };
}
