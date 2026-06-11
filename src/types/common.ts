export interface MultiLanguageString {
  en?: string | null;
  kr?: string | null;
}

/**
 * Standard server-side pagination envelope. Mirrors the backend
 * `PaginatedData[T]` Pydantic model (app/schemas/response.py) returned by the
 * v2 list endpoints (hotels / activities / restaurants).
 */
export interface PaginatedData<T> {
  items: T[];
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  has_more: boolean;
}

/**
 * Slim, FE-facing projection of a {@link PaginatedData} page — the single shape
 * the api-client list methods (getHotels / getActivities / getRestaurants)
 * resolve to. Callers read `.items`; infinite-scroll consumers read `hasMore`
 * and `page`.
 */
export interface PaginatedResult<T> {
  items: T[];
  hasMore: boolean;
  total: number;
  page: number;
}

export function toPaginatedResult<T>(data: PaginatedData<T>): PaginatedResult<T> {
  return {
    items: data.items,
    hasMore: data.has_more,
    total: data.total,
    page: data.current_page,
  };
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Policy {
  type: string;
  description: MultiLanguageString;
}

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Image {
  original: string;
  w128?: string | null;
  w400?: string | null;
  w800?: string | null;
  w1200?: string | null;
  alt?: MultiLanguageString | null;
  crop?: CropRect | null;
}

export function getLocalizedText(
  value?: MultiLanguageString | string | null,
  preferredLanguage: 'en' | 'kr' = 'en',
): string {
  if (!value) return '';
  if (typeof value === 'string') return value;

  const preferred = value[preferredLanguage];
  if (preferred) return preferred;

  const fallback = preferredLanguage === 'en' ? value.kr : value.en;
  return fallback || '';
}

/**
 * Resolve an S3 object key (or absolute URL) to a fetchable URL. http(s)
 * values pass through unchanged; a bare key is prepended with
 * `NEXT_PUBLIC_S3_ENDPOINT` (a leading slash on the key is stripped first).
 * Returns '' when the key or endpoint is missing — callers decide their own
 * fallback (image callers fall back to a placeholder; document callers don't).
 */
export function resolveS3Url(key?: string | null): string {
  if (!key) return '';

  if (key.startsWith('http://') || key.startsWith('https://')) {
    return key;
  }

  const s3Endpoint = process.env.NEXT_PUBLIC_S3_ENDPOINT;
  if (!s3Endpoint) return '';

  const cleanKey = key.startsWith('/') ? key.slice(1) : key;
  return `${s3Endpoint}/${cleanKey}`;
}

export function getImageUrl(image?: string | Image | null): string {
  if (!image) return '/placeholder.jpg';

  const rawPath =
    typeof image === 'string'
      ? image
      : image.w1200 || image.w800 || image.w400 || image.w128 || image.original;

  return resolveS3Url(rawPath) || '/placeholder.jpg';
}
