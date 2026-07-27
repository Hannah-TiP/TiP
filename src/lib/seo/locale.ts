import type { Lang } from '@/contexts/LanguageContext';
import en from '@/translations/en.json';
import kr from '@/translations/kr.json';

/**
 * Site origin used as the metadata base and as the JSON-LD / canonical URL
 * prefix. Reads `AUTH_URL` (already set for NextAuth, and equal to the public
 * site origin in every environment) and falls back to the production apex.
 * Used for `metadataBase`, canonical URLs, and absolute JSON-LD `url`s.
 */
export const SITE_ORIGIN = process.env.AUTH_URL || 'https://www.travelinyourpocket.com';

/**
 * Map our internal UI language (`'en' | 'kr'`) to a BCP-47 language tag for
 * emit-time use ONLY (Open Graph `og:locale`, JSON-LD `inLanguage`,
 * `<html lang>`, hreflang). The i18n key stays `'kr'` everywhere else — this is
 * the single place we translate `kr → ko`.
 */
export function krToBcp47(lang: Lang): string {
  return lang === 'kr' ? 'ko' : 'en';
}

/**
 * Open Graph `og:locale` region tag (`ko_KR` / `en_US`) for the given UI
 * language. OG locales are underscore-joined region tags, distinct from the
 * hyphenated BCP-47 tags used by hreflang.
 */
export function krToOgLocale(lang: Lang): string {
  return lang === 'kr' ? 'ko_KR' : 'en_US';
}

/**
 * Normalize a backend `available_locales` entry (`'en'`, `'kr'`, `'ko'`, …) to
 * a hreflang BCP-47 tag. Unrecognized locales are passed through lowercased so a
 * future locale (e.g. `'fr'`) still emits a sensible tag.
 */
export function localeToHreflang(locale: string): string {
  const normalized = locale.trim().toLowerCase();
  if (normalized === 'kr' || normalized === 'ko') return 'ko';
  if (normalized === 'en') return 'en';
  return normalized;
}

const translations: Record<Lang, Record<string, string>> = { en, kr };

/**
 * Server-side translation lookup for the SEO layer (no React context available
 * in `generateMetadata` / server JSON-LD components). Mirrors the client
 * `useLanguage().t` resolution order: requested language → EN fallback → key.
 */
export function serverT(key: keyof typeof en, lang: Lang): string {
  return translations[lang][key] || translations.en[key] || key;
}

/** Build an absolute URL on the publish origin for a site-relative path. */
export function absoluteUrl(path: string): string {
  const base = SITE_ORIGIN.replace(/\/$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}${suffix}`;
}
