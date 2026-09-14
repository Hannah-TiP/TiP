// Client-side access to the benefit registry payload (SMA-322 PR 3).
//
// GET /api/v2/benefits is static per deploy, so the response is fetched
// once and cached at module level; every consumer (membership page,
// credits page, travel-history detail) shares the same promise. A failed
// fetch resolves to null (consumers degrade to the static fallbacks in
// src/lib/benefits-fallback.ts) and clears the cache so a later mount can
// retry.

import { apiClient } from '@/lib/api-client';
import { usdCentsToPoints } from '@/lib/points-wallet';
import type {
  BenefitItem,
  BenefitsResponse,
  BenefitUnit,
  MembershipTier,
} from '@/types/v2/benefits';
import {
  FALLBACK_BENEFIT_CREDIT,
  FALLBACK_CERCLE_LOYALTY_NIGHTS,
  FALLBACK_CONFIDENCE_SIGNATURE_NIGHTS,
} from '@/lib/benefits-fallback';

let cached: Promise<BenefitsResponse | null> | null = null;

export function fetchBenefits(): Promise<BenefitsResponse | null> {
  if (!cached) {
    // Promise.resolve().then(...) also captures a SYNCHRONOUS throw from
    // the client, so a consumer can never crash on benefits loading.
    cached = Promise.resolve()
      .then(() => apiClient.getBenefits())
      .catch(() => {
        // Endpoint unavailable — degrade to the static fallbacks and let a
        // later mount retry instead of pinning the failure for the session.
        cached = null;
        return null;
      });
  }
  return cached;
}

export function clearBenefitsCache(): void {
  cached = null;
}

// ── Payload lookups ────────────────────────────────────────────────────────

export function findBenefit(
  benefits: BenefitsResponse | null | undefined,
  key: string,
): BenefitItem | null {
  return benefits?.benefits.find((item) => item.key === key) ?? null;
}

// The raw wire value (Decimal string) a benefit declares for a tier, or
// null when the payload / entry / tier value is absent.
export function benefitTierValue(
  benefits: BenefitsResponse | null | undefined,
  key: string,
  tier: MembershipTier,
): string | null {
  return findBenefit(benefits, key)?.values_by_tier?.[tier] ?? null;
}

// The signed-in caller's own resolved value for a benefit (from the
// `resolved` block), or null for anonymous callers / absent values.
export function resolvedBenefitValue(
  benefits: BenefitsResponse | null | undefined,
  key: string,
): string | null {
  const resolved = benefits?.resolved;
  if (!resolved) return null;
  return resolved.benefits.find((item) => item.key === key)?.value ?? null;
}

// Points per 1 USD from the registry's structural `point_unit` entry
// (SMA-332). The signed-in caller's resolved value wins; anonymous or
// resolved-less payloads read the tier-agnostic declared value (identical
// across tiers). Null when the payload / entry is absent or the value is not
// a positive finite number — consumers hide the USD line rather than guess.
export function resolvePointUnit(benefits: BenefitsResponse | null | undefined): number | null {
  const raw =
    resolvedBenefitValue(benefits, 'point_unit') ??
    findBenefit(benefits, 'point_unit')?.values_by_tier?.carte ??
    null;
  if (raw === null || !raw.trim()) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

// ── Point figures for ledger grants (SMA-358) ──────────────────────────────

// Display names of the membership circles — proper nouns, identical in EN
// and KR copy.
export const MEMBERSHIP_TIER_NAMES: Record<MembershipTier, string> = {
  carte: 'Carte',
  cercle: 'Cercle',
  confidence: 'Confidence',
  cenacle: 'Cénacle',
};

// A benefit's wire value as whole points: `points` entries are read
// directly, `usd_cents` entries convert via the registry `point_unit`.
// Any other unit (rates, nights) is not a point grant → null.
function pointsFromBenefitValue(
  unit: BenefitUnit | null,
  raw: string,
  pointsPerUsd: number | null,
): number | null {
  const parsed = Number(raw);
  if (!raw.trim() || !Number.isFinite(parsed)) return null;
  if (unit === 'points') return Math.floor(parsed);
  if (unit === 'usd_cents') return usdCentsToPoints(parsed, pointsPerUsd);
  return null;
}

// Whole points a ledger-grant benefit declares for a tier (e.g. the
// referral joiner reward at Carte), or null when the payload / entry /
// tier value / point unit is absent.
export function benefitTierPoints(
  benefits: BenefitsResponse | null | undefined,
  key: string,
  tier: MembershipTier,
): number | null {
  const entry = findBenefit(benefits, key);
  const raw = entry?.values_by_tier?.[tier];
  if (!entry || raw == null) return null;
  return pointsFromBenefitValue(entry.unit, raw, resolvePointUnit(benefits));
}

// The signed-in caller's OWN resolved point value for a ledger-grant
// benefit (from the `resolved` block), or null for anonymous callers.
export function resolvedBenefitPoints(
  benefits: BenefitsResponse | null | undefined,
  key: string,
): number | null {
  const resolved = benefits?.resolved?.benefits.find((item) => item.key === key);
  if (!resolved?.value) return null;
  return pointsFromBenefitValue(resolved.unit, resolved.value, resolvePointUnit(benefits));
}

// The largest point value a ledger-grant benefit declares across tiers —
// for "up to {points}" copy where the granting tier is not yet known (the
// invite-time referral reward keys off the REFERRER's tier).
export function maxBenefitPoints(
  benefits: BenefitsResponse | null | undefined,
  key: string,
): number | null {
  const entry = findBenefit(benefits, key);
  if (!entry?.values_by_tier) return null;
  const pointUnit = resolvePointUnit(benefits);
  const values = Object.values(entry.values_by_tier)
    .map((raw) => pointsFromBenefitValue(entry.unit, raw, pointUnit))
    .filter((value): value is number => value !== null);
  return values.length > 0 ? Math.max(...values) : null;
}

// ── Display formatting ─────────────────────────────────────────────────────

// "0.001" → "0.1%". Display-only: parse, scale to percent, and round away
// binary-float drift (3 decimal places is plenty for earn rates).
export function formatRatePercent(rate: string): string | null {
  if (!rate.trim()) return null;
  const parsed = Number(rate);
  if (!Number.isFinite(parsed)) return null;
  const percent = Math.round(parsed * 100_000) / 1_000;
  return `${percent}%`;
}

// "10000" (USD cents) → "$100". Dollar figures render identically in EN and
// KR copy, so en-US currency formatting is used for both.
export function formatUsdCents(cents: string): string | null {
  if (!cents.trim()) return null;
  const parsed = Number(cents);
  if (!Number.isFinite(parsed)) return null;
  const dollars = parsed / 100;
  const fractionDigits = Number.isInteger(dollars) ? 0 : 2;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(dollars);
}

// Whole-number wire values ("17" nights) → display string, or null when
// unparsable.
export function formatWholeNumber(value: string): string | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return String(parsed);
}

// Substitute {placeholders} in a copy template. Unknown placeholders are
// left as-is so a missing var is visible, never a crash.
export function fillVars(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) => vars[name] ?? match);
}

// ── Membership-page money figures ──────────────────────────────────────────

export interface MembershipBenefitFigures {
  // Per-booking Benefit Credit display amount by circle ("$100" …).
  benefitCredit: Record<MembershipTier, string>;
  // Free-night thresholds in nights ("17" / "10").
  cercleLoyaltyNights: string;
  confidenceSignatureNights: string;
}

function usdFigure(
  benefits: BenefitsResponse | null,
  key: string,
  tier: MembershipTier,
  fallback: string,
): string {
  const raw = benefitTierValue(benefits, key, tier);
  return (raw && formatUsdCents(raw)) || fallback;
}

function nightsFigure(
  benefits: BenefitsResponse | null,
  key: string,
  tier: MembershipTier,
  fallback: string,
): string {
  const raw = benefitTierValue(benefits, key, tier);
  return (raw && formatWholeNumber(raw)) || fallback;
}

// Resolve every money/threshold figure the membership tier cards render,
// preferring the payload and degrading per-figure to the static fallbacks.
// Ledger point grants (e.g. the Confidence welcome points) are NOT here —
// they render in P via `benefitTierPoints` and drop the figure when the
// registry is unavailable rather than falling back to a currency literal.
export function membershipBenefitFigures(
  benefits: BenefitsResponse | null,
): MembershipBenefitFigures {
  return {
    benefitCredit: {
      carte: usdFigure(benefits, 'benefit_credit', 'carte', FALLBACK_BENEFIT_CREDIT.carte),
      cercle: usdFigure(benefits, 'benefit_credit', 'cercle', FALLBACK_BENEFIT_CREDIT.cercle),
      confidence: usdFigure(
        benefits,
        'benefit_credit',
        'confidence',
        FALLBACK_BENEFIT_CREDIT.confidence,
      ),
      cenacle: usdFigure(benefits, 'benefit_credit', 'cenacle', FALLBACK_BENEFIT_CREDIT.cenacle),
    },
    cercleLoyaltyNights: nightsFigure(
      benefits,
      'cercle_loyalty_night',
      'cercle',
      FALLBACK_CERCLE_LOYALTY_NIGHTS,
    ),
    confidenceSignatureNights: nightsFigure(
      benefits,
      'confidence_signature_night',
      'confidence',
      FALLBACK_CONFIDENCE_SIGNATURE_NIGHTS,
    ),
  };
}

// ── Points policy figures (SMA-359) ────────────────────────────────────────

// Registry keys of the policy entries served alongside the tier benefits
// (the admin-configurable SMA-326 values made visible to members).
// Tier-agnostic: every tier carries the same value in `values_by_tier`, and
// signed-in callers also get them in `resolved.benefits`. Every consumer
// tolerates their absence (older backend) and renders figure-free copy.
export const POINTS_POLICY_BENEFIT_KEYS = {
  // Per-booking redemption cap, unit `rate` (e.g. "0.05").
  redemptionCap: 'redemption_cap',
  // Review reward for an approved text-only review, unit `points`.
  reviewRewardText: 'review_reward_text',
  // Review reward for an approved review with a photo, unit `points`.
  reviewRewardPhoto: 'review_reward_photo',
  // Point validity window from grant, unit `months`.
  pointValidityMonths: 'point_validity_months',
} as const;

// Tier-agnostic policy value: the signed-in caller's resolved value wins,
// then the declared value (identical for every tier — read whichever tier
// the payload carries). Null when the payload / entry is absent, so every
// consumer renders its figure-free copy on an older backend.
export function flatBenefitValue(
  benefits: BenefitsResponse | null | undefined,
  key: string,
): string | null {
  const resolved = resolvedBenefitValue(benefits, key);
  if (resolved !== null) return resolved;
  const values = findBenefit(benefits, key)?.values_by_tier;
  if (!values) return null;
  return Object.values(values).find((value) => value != null) ?? null;
}

// Whole point figure for a "{n} P"-style template: "1000" → "1,000" (the
// template carries the unit, so the figure is grouped but unit-less; en-US
// grouping reads right in both languages). Null when unparsable / negative.
export function formatPointsFigure(value: string): string | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.floor(parsed).toLocaleString('en-US');
}

export interface ReviewRewardFigures {
  // Grouped point figures without the unit ("500" / "1,000").
  text: string;
  photo: string;
}

// The review reward amounts from the registry's `review_reward_text` /
// `review_reward_photo` policy entries. Both are required for the amount
// copy; null when either is missing so the page shows the figure-free line.
export function reviewRewardFigures(
  benefits: BenefitsResponse | null | undefined,
): ReviewRewardFigures | null {
  const text = flatBenefitValue(benefits, POINTS_POLICY_BENEFIT_KEYS.reviewRewardText);
  const photo = flatBenefitValue(benefits, POINTS_POLICY_BENEFIT_KEYS.reviewRewardPhoto);
  if (text === null || photo === null) return null;
  const textFigure = formatPointsFigure(text);
  const photoFigure = formatPointsFigure(photo);
  if (textFigure === null || photoFigure === null) return null;
  return { text: textFigure, photo: photoFigure };
}

// Point validity in months from the registry's `point_validity_months`
// entry ("24"), or null when absent / not a positive whole number.
export function pointValidityMonths(benefits: BenefitsResponse | null | undefined): string | null {
  const raw = flatBenefitValue(benefits, POINTS_POLICY_BENEFIT_KEYS.pointValidityMonths);
  if (raw === null) return null;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return String(parsed);
}
