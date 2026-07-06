import type { MagazineArticleType } from '@/types/magazine';

/**
 * Filter state for the magazine index list. `type` `null` means "All". The
 * three FK facets and `tag` are optional; `tag` is a single string value (the
 * EN or KR label of a tag) matching the backend `list_articles` contract.
 */
export interface MagazineListFilters {
  type?: MagazineArticleType | null;
  country_id?: number | null;
  city_id?: number | null;
  brand_id?: number | null;
  tag?: string | null;
  language?: string;
  page?: number;
  per_page?: number;
}

/**
 * Map the magazine index filter state to the `GET /api/v2/magazine/articles`
 * query params. Empty / null / "All" values are omitted so the resulting query
 * string only carries active filters (keeps URLs + requests minimal). Pure —
 * unit-tested independently of the apiClient.
 */
export function magazineArticlesQuery(filters: MagazineListFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.type) params.set('type', filters.type);
  if (filters.country_id != null) params.set('country_id', String(filters.country_id));
  if (filters.city_id != null) params.set('city_id', String(filters.city_id));
  if (filters.brand_id != null) params.set('brand_id', String(filters.brand_id));
  if (filters.tag) params.set('tag', filters.tag);
  if (filters.language) params.set('language', filters.language);
  if (filters.page != null) params.set('page', String(filters.page));
  if (filters.per_page != null) params.set('per_page', String(filters.per_page));
  return params;
}
