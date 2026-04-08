export interface MultiLanguageString {
  en?: string | null;
  kr?: string | null;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Policy {
  type: string;
  description: MultiLanguageString;
}

export interface Image {
  original: string;
  w128?: string | null;
  w400?: string | null;
  w800?: string | null;
  w1200?: string | null;
  alt?: MultiLanguageString | null;
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

export function getImageUrl(image?: string | Image | null): string {
  if (!image) return '/placeholder.jpg';

  const rawPath =
    typeof image === 'string'
      ? image
      : image.w1200 || image.w800 || image.w400 || image.w128 || image.original;

  if (!rawPath) return '/placeholder.jpg';

  if (rawPath.startsWith('http://') || rawPath.startsWith('https://')) {
    return rawPath;
  }

  const s3Endpoint = process.env.NEXT_PUBLIC_S3_ENDPOINT;
  if (!s3Endpoint) {
    console.warn('NEXT_PUBLIC_S3_ENDPOINT not configured');
    return '/placeholder.jpg';
  }

  const cleanPath = rawPath.startsWith('/') ? rawPath.slice(1) : rawPath;
  return `${s3Endpoint}/${cleanPath}`;
}
