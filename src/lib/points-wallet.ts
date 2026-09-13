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

/**
 * Display a signed ledger delta with an explicit sign and the point unit:
 * 10000 → "+10,000 P", -1200 → "−1,200 P" (a real minus sign, U+2212 —
 * never the ASCII hyphen). Zero renders unsigned ("0 P"). Null (a legacy
 * pre-ledger row with no recorded delta) renders an em dash — never NaN.
 */
export function formatSignedPoints(delta: number | null | undefined): string {
  if (delta == null || !Number.isFinite(delta)) return '—';
  if (delta > 0) return `+${formatPoints(delta)}`;
  if (delta < 0) return `−${formatPoints(Math.abs(delta))}`;
  return formatPoints(0);
}

/**
 * Whole-USD approximation of a point balance (SMA-332 — display only,
 * computed once, never stored): floor(balance / pointsPerUsd). `pointsPerUsd`
 * is the registry's `point_unit` value (points per 1 USD); returns null when
 * it is absent or not a positive finite number so callers can hide the line.
 */
export function pointsToUsdApprox(
  balancePoints: number,
  pointsPerUsd: number | null | undefined,
): number | null {
  if (pointsPerUsd == null || !Number.isFinite(pointsPerUsd) || pointsPerUsd <= 0) return null;
  if (!Number.isFinite(balancePoints)) return null;
  return Math.floor(balancePoints / pointsPerUsd);
}
