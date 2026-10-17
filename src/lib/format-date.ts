import type { Lang } from '@/contexts/LanguageContext';

/**
 * Map the app language to the BCP-47 locale used for date/time (and currency)
 * formatting. EN → en-US, KR → ko-KR. Centralized here so no call site
 * hardcodes a locale.
 */
export function localeForLang(lang: Lang): string {
  return lang === 'en' ? 'en-US' : 'ko-KR';
}

/** Strict calendar-date shape: `YYYY-MM-DD`, no time, no zone. */
const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parse a `YYYY-MM-DD` calendar date as LOCAL midnight.
 *
 * `new Date('2026-10-20')` parses as UTC midnight, which is Oct 19 17:00 in
 * Los Angeles — so every device west of UTC renders the trip one day early.
 * `new Date(2026, 9, 20)` is local midnight and never drifts. Use this for
 * trip/quote/version `start_date` / `end_date` and itinerary `day.date`, which
 * are calendar dates, NOT timestamps. Full ISO datetimes (`expires_at`,
 * `paid_at`, `created_at`, item `start_at`/`end_at`) carry an offset and must
 * keep going through `new Date`.
 *
 * Returns an Invalid Date (NaN time) for anything that isn't a well-formed,
 * real calendar date, so the formatters' existing NaN guards keep working.
 */
export function parseLocalDate(dateStr: string): Date {
  if (!DATE_ONLY_RE.test(dateStr)) return new Date(NaN);
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  // Reject out-of-range fields that the Date constructor would silently roll
  // over (e.g. 2026-02-30 → Mar 2).
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
    return new Date(NaN);
  }
  return date;
}

/**
 * Coerce a formatter input to a Date. Date-only strings are routed through
 * `parseLocalDate`; everything else (ISO datetimes, epoch numbers, Dates) keeps
 * the `new Date` path.
 */
function toDate(value: string | number | Date): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'string' && DATE_ONLY_RE.test(value)) return parseLocalDate(value);
  return new Date(value);
}

/**
 * Format a date for display in the active app language. Accepts a Date, an
 * epoch number, or a parseable date string. Returns the raw string (or empty
 * for invalid input) rather than "Invalid Date", mirroring the guarded local
 * helpers it replaces.
 *
 * A date-only string (`YYYY-MM-DD`) is parsed as a LOCAL calendar date (see
 * `parseLocalDate`), so trip dates render the same day in every timezone.
 */
export function formatDate(
  value: string | number | Date,
  lang: Lang,
  opts?: Intl.DateTimeFormatOptions,
): string {
  const date = toDate(value);
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
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return typeof value === 'string' ? value : '';
  return date.toLocaleTimeString(localeForLang(lang), opts);
}

/**
 * Format a date-time (date + time together) for display in the active app
 * language, via `toLocaleString`. Used where a single call renders both parts.
 * Date-only strings follow the same local-calendar-date rule as `formatDate`.
 */
export function formatDateTime(
  value: string | number | Date,
  lang: Lang,
  opts?: Intl.DateTimeFormatOptions,
): string {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return typeof value === 'string' ? value : '';
  return date.toLocaleString(localeForLang(lang), opts);
}

/**
 * Format a start–end date range in the active app language. `opts` applies to
 * BOTH ends; pass `endOpts` to override the end (e.g. to add the year only on
 * the end). Returns `null` when either end is missing/invalid so callers can
 * conditionally render. Date-only strings follow the same local-calendar-date
 * rule as `formatDate`.
 */
export function formatDateRange(
  start: string | number | Date,
  end: string | number | Date,
  lang: Lang,
  opts?: Intl.DateTimeFormatOptions,
  endOpts?: Intl.DateTimeFormatOptions,
): string | null {
  const startDate = toDate(start);
  const endDate = toDate(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return null;
  const locale = localeForLang(lang);
  const startLabel = startDate.toLocaleDateString(locale, opts);
  const endLabel = endDate.toLocaleDateString(locale, endOpts ?? opts);
  return `${startLabel} – ${endLabel}`;
}
