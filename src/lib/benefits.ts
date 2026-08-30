// Client-side access to the benefit registry payload (SMA-322 PR 3).
//
// GET /api/v2/benefits is static per deploy, so the response is fetched
// once and cached at module level; every consumer (membership page,
// credits page, travel-history detail) shares the same promise. A failed
// fetch resolves to null (consumers degrade to the static fallbacks in
// src/lib/benefits-fallback.ts) and clears the cache so a later mount can
// retry.

import { apiClient } from '@/lib/api-client';
import type { BenefitItem, BenefitsResponse, MembershipTier } from '@/types/v2/benefits';
import {
  FALLBACK_BENEFIT_CREDIT,
  FALLBACK_CERCLE_LOYALTY_NIGHTS,
  FALLBACK_CONFIDENCE_SIGNATURE_NIGHTS,
  FALLBACK_CONFIDENCE_WELCOME,
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
  // Confidence one-time welcome credit ("$500").
  confidenceWelcome: string;
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
    confidenceWelcome: usdFigure(
      benefits,
      'confidence_welcome',
      'confidence',
      FALLBACK_CONFIDENCE_WELCOME,
    ),
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
