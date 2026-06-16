import type { Lang } from '@/contexts/LanguageContext';

/**
 * Map the app language to the BCP-47 locale used for date/time (and currency)
 * formatting. EN → en-US, KR → ko-KR. Centralized here so no call site
 * hardcodes a locale.
 */
export function localeForLang(lang: Lang): string {
  return lang === 'en' ? 'en-US' : 'ko-KR';
}

/**
 * Format a date for display in the active app language. Accepts a Date, an
 * epoch number, or a parseable date string. Returns the raw string (or empty
 * for invalid input) rather than "Invalid Date", mirroring the guarded local
 * helpers it replaces.
 */
export function formatDate(
  value: string | number | Date,
  lang: Lang,
  opts?: Intl.DateTimeFormatOptions,
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return typeof value === 'string' ? value : '';
  return date.toLocaleDateString(localeForLang(lang), opts);
}

/**
 * Format a time for display in the active app language. Same guarding as
 * `formatDate`.
 */
export function formatTime(
  value: string | number | Date,
  lang: Lang,
  opts?: Intl.DateTimeFormatOptions,
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return typeof value === 'string' ? value : '';
  return date.toLocaleTimeString(localeForLang(lang), opts);
}

/**
 * Format a date-time (date + time together) for display in the active app
 * language, via `toLocaleString`. Used where a single call renders both parts.
 */
export function formatDateTime(
  value: string | number | Date,
  lang: Lang,
  opts?: Intl.DateTimeFormatOptions,
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return typeof value === 'string' ? value : '';
  return date.toLocaleString(localeForLang(lang), opts);
}

/**
 * Format a start–end date range in the active app language. `opts` applies to
 * BOTH ends; pass `endOpts` to override the end (e.g. to add the year only on
 * the end). Returns `null` when either end is missing/invalid so callers can
 * conditionally render.
 */
export function formatDateRange(
  start: string | number | Date,
  end: string | number | Date,
  lang: Lang,
  opts?: Intl.DateTimeFormatOptions,
  endOpts?: Intl.DateTimeFormatOptions,
): string | null {
  const startDate = start instanceof Date ? start : new Date(start);
  const endDate = end instanceof Date ? end : new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return null;
  const locale = localeForLang(lang);
  const startLabel = startDate.toLocaleDateString(locale, opts);
  const endLabel = endDate.toLocaleDateString(locale, endOpts ?? opts);
  return `${startLabel} – ${endLabel}`;
}
