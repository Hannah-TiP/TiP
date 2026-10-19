import type { GeoPoint, Image, MultiLanguageString } from '@/types/common';

interface LocationBase {
  id: number;
  status: boolean;
  name: MultiLanguageString;
  geo?: GeoPoint | null;
  cover_image?: Image | null;
  schema_version: number;
  created_at?: string | null;
  updated_at?: string | null;
}

// These match the lang-collapsed v2 API response shape used by TiP.
export interface Country extends LocationBase {
  iso_code: string;
}

export interface Region extends LocationBase {
  country_id: number;
  slug: string;
}

export interface City extends LocationBase {
  region_id: number;
  slug: string;
  link_services: boolean;
}

/**
 * City enriched with its parent region + country names (mirrors backend
 * `CityWithLocation`). Returned by POST /locations/cities/resolve (SMA-644).
 */
export interface CityWithLocation extends City {
  region_name?: MultiLanguageString | string | null;
  country_iso_code?: string | null;
  country_name?: MultiLanguageString | string | null;
}

/** Where city suggestions came from: Google Places, or the DB fallback. */
export type CitySuggestionSource = 'google' | 'db';

/**
 * One home-city picker suggestion (mirrors backend `CitySuggestion`).
 * Google rows carry `place_id` (resolve on pick); DB-fallback rows carry
 * `city_id` (use directly).
 */
export interface CitySuggestion {
  place_id: string | null;
  city_id: number | null;
  primary_text: string;
  secondary_text: string | null;
}

/** Mirrors backend `CitySuggestionsResponse` (the envelope's `data`). */
export interface CitySuggestionsResponse {
  source: CitySuggestionSource;
  suggestions: CitySuggestion[];
}
