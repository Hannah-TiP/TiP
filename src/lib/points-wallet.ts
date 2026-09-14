/**
 * Pure helpers for the quote-page points wallet panel (SMA-329).
 *
 * Client-side validation MIRRORS the server rules (amount must be a whole
 * number ≥ 1 and ≤ the max applicable to the booking) purely for UX — the
 * server stays authoritative and its localized `message` is surfaced when a
 * request is rejected anyway.
 */

import type { ProjectedTripEarn, RedeemPromoCodeResponse } from '@/types/stay-credit';

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

/**
 * USD cents → whole points via the registry `point_unit` (points per 1 USD),
 * floored. Null when the unit is absent/invalid or the cents are not finite —
 * callers hide the figure rather than guess a ratio.
 */
export function usdCentsToPoints(
  cents: number,
  pointsPerUsd: number | null | undefined,
): number | null {
  if (pointsPerUsd == null || !Number.isFinite(pointsPerUsd) || pointsPerUsd <= 0) return null;
  if (!Number.isFinite(cents)) return null;
  // Multiply before dividing: `(29 / 100) * 100` drifts to 28.999… and the
  // floor would eat a point; `(29 * 100) / 100` is exact for integer inputs.
  return Math.floor((cents * pointsPerUsd) / 100);
}

/**
 * The P figure for a pending-earn projection (SMA-358). The backend's
 * `projected_points` (integer, floored server-side) wins; an older backend
 * that omits it falls back to converting `projected_amount_cents` ONLY when
 * the projection is USD-denominated — never an invented FX rate for other
 * currencies (null ⇒ figure-less copy).
 */
export function projectedPoints(
  projection: ProjectedTripEarn,
  pointsPerUsd: number | null | undefined,
): number | null {
  if (
    typeof projection.projected_points === 'number' &&
    Number.isFinite(projection.projected_points)
  ) {
    return Math.floor(projection.projected_points);
  }
  if (projection.currency !== 'USD') return null;
  return usdCentsToPoints(projection.projected_amount_cents, pointsPerUsd);
}

/**
 * The P figure credited by a promo-code redemption (SMA-358). `credited_points`
 * wins; an older backend that omits it falls back to the USD `credited_amount`
 * converted via `point_unit` — other currencies yield null (generic success copy).
 */
export function redeemedPoints(
  result: RedeemPromoCodeResponse,
  pointsPerUsd: number | null | undefined,
): number | null {
  if (typeof result.credited_points === 'number' && Number.isFinite(result.credited_points)) {
    return Math.floor(result.credited_points);
  }
  if (result.currency !== 'USD') return null;
  const amount = Number(result.credited_amount);
  if (!Number.isFinite(amount)) return null;
  return usdCentsToPoints(Math.round(amount * 100), pointsPerUsd);
}
