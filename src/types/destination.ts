import type { MultiLanguageString } from '@/types/common';

export interface DestinationSuggestion {
  id: number;
  type: 'country' | 'region' | 'city';
  name: MultiLanguageString;
  iso_code?: string;
  slug?: string;
  region_name?: MultiLanguageString;
  country_name?: MultiLanguageString;
}
