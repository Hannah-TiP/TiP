/**
 * Pure helpers for the quote-page points wallet panel (SMA-329).
 *
 * Client-side validation MIRRORS the server rules (amount must be a whole
 * number ≥ 1 and ≤ the max applicable to the booking) purely for UX — the
 * server stays authoritative and its localized `message` is surfaced when a
 * request is rejected anyway.
 */

export type PointsInputError = 'invalid' | 'exceeds';

/**
 * Validate the raw points input against the quote's max applicable points.
 * Returns null when the input is a valid whole number in [1, maxApplicable].
 */
export function pointsInputError(raw: string, maxApplicable: number): PointsInputError | null {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return 'invalid';
  const value = Number(trimmed);
  if (!Number.isSafeInteger(value) || value < 1) return 'invalid';
  if (value > maxApplicable) return 'exceeds';
  return null;
}

/** Parse a validated points input ("2500" → 2500); null when invalid. */
export function parsePoints(raw: string): number | null {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const value = Number(trimmed);
  return Number.isSafeInteger(value) ? value : null;
}

/** Display a point amount with the point unit symbol: 2500 → "2,500 P". */
export function formatPoints(points: number): string {
  return `${points.toLocaleString('en-US')} P`;
}
