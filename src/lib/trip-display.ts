import type { TripPlanItem } from '@/types/trip';

/** Human-readable label for each plan item type. */
export const ITEM_LABELS: Record<TripPlanItem['item_type'], string> = {
  flight: 'Flight',
  hotel: 'Hotel',
  restaurant: 'Restaurant',
  activity: 'Activity',
  transfer: 'Transfer',
  note: 'Note',
};

/** Tailwind color classes for the item-type badge. */
export const ITEM_COLORS: Record<TripPlanItem['item_type'], string> = {
  flight: 'bg-blue-100 text-blue-700',
  hotel: 'bg-purple-100 text-purple-700',
  restaurant: 'bg-amber-100 text-amber-700',
  activity: 'bg-green-100 text-green-700',
  transfer: 'bg-cyan-100 text-cyan-700',
  note: 'bg-gray-100 text-gray-600',
};

/** Format a YYYY-MM-DD date as e.g. "Mon, May 1". Parses as a local date — `new Date('2026-05-02')` would parse as UTC midnight and drift one day in western timezones. */
export function formatDateLabel(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts.map((p) => parseInt(p, 10));
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return dateStr;
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/** Format an ISO datetime as e.g. "9:30 AM". Returns undefined for empty input. */
export function formatTime(dateStr?: string | null): string | undefined {
  if (!dateStr) return undefined;
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}
