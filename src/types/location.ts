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
