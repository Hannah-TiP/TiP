import type { Image, MultiLanguageString, Policy } from '@/types/common';

export type ActivityKind = 'local_experience' | 'package';

export interface Activity {
  id: number;
  slug: string;
  city_id?: number | null;
  category?: string | null;
  kind?: ActivityKind | null;
  status: 'draft' | 'published' | 'archived';
  name?: MultiLanguageString | null;
  description?: MultiLanguageString | null;
  images?: Image[] | null;
  opening_hours?: MultiLanguageString | null;
  visit_duration?: MultiLanguageString | null;
  address?: MultiLanguageString | null;
  policies?: Policy[] | null;
  schema_version: number;
  created_at?: string | null;
  updated_at?: string | null;
}
