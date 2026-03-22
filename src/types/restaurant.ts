import type { Image, MultiLanguageString } from '@/types/common';

export enum MichelinTier {
  ONE_STAR = '1_star',
  TWO_STARS = '2_stars',
  THREE_STARS = '3_stars',
  BIB_GOURMAND = 'bib_gourmand',
  SELECTED = 'selected',
}

export interface RestaurantRecognition {
  source_type: 'michelin' | 'worlds_50_best' | 'james_beard' | 'tripadvisor' | 'other';
  tier?: MichelinTier | string | null;
  year?: number | null;
  url?: string | null;
}

export interface Restaurant {
  id: number;
  city_id?: number | null;
  slug: string;
  status: 'draft' | 'published' | 'archived';
  name?: MultiLanguageString | null;
  description?: MultiLanguageString | null;
  opening_hours?: MultiLanguageString | null;
  address?: MultiLanguageString | null;
  recognitions?: RestaurantRecognition[] | null;
  images?: Image[] | null;
  schema_version: number;
  created_at?: string | null;
  updated_at?: string | null;
}
