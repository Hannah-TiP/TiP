import type { TripPlanItem } from '@/types/trip';
import type { Lang, TranslationKeys } from '@/contexts/LanguageContext';
import { formatDate, formatTime as formatTimeI18n } from '@/lib/format-date';

/** i18n catalog key for each plan item type's human-readable label. */
export const ITEM_LABEL_KEYS: Record<TripPlanItem['item_type'], TranslationKeys> = {
  flight: 'trip.item_flight',
  hotel: 'trip.item_hotel',
  restaurant: 'trip.item_restaurant',
  activity: 'trip.item_activity',
  transfer: 'trip.item_transfer',
  note: 'trip.item_note',
};

/**
 * Resolve the localized label for a plan item type. This is a plain module (not a
 * React component), so callers pass `t` from `useLanguage()`.
 */
export function getItemLabel(
  itemType: TripPlanItem['item_type'],
  t: (key: TranslationKeys) => string,
): string {
  return t(ITEM_LABEL_KEYS[itemType]);
}

/** Tailwind color classes for the item-type badge. */
export const ITEM_COLORS: Record<TripPlanItem['item_type'], string> = {
  flight: 'bg-blue-100 text-blue-700',
  hotel: 'bg-purple-100 text-purple-700',
  restaurant: 'bg-amber-100 text-amber-700',
  activity: 'bg-green-100 text-green-700',
  transfer: 'bg-cyan-100 text-cyan-700',
  note: 'bg-gray-100 text-gray-600',
};

/** Format a YYYY-MM-DD date as e.g. "Mon, May 1" (EN) / "5월 1일 (월)" (KR). Parses as a local date — `new Date('2026-05-02')` would parse as UTC midnight and drift one day in western timezones. */
export function formatDateLabel(dateStr: string, lang: Lang): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts.map((p) => parseInt(p, 10));
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return dateStr;
  return formatDate(new Date(y, m - 1, d), lang, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/** Format an ISO datetime as e.g. "9:30 AM". Returns undefined for empty input. */
export function formatTime(dateStr: string | null | undefined, lang: Lang): string | undefined {
  if (!dateStr) return undefined;
  return formatTimeI18n(dateStr, lang, {
    hour: 'numeric',
    minute: '2-digit',
  });
}
