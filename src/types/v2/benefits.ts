// Mirrors tip-backend/v2/data_model/schemas/benefit.py (SMA-322 PR 2) —
// the wire shapes of GET /api/v2/benefits. Names are IDENTICAL to the
// backend Pydantic models.

// Mirrors v2/data_model/enums.py::BenefitKind.
export type BenefitKind = 'earn_rate' | 'per_booking_discount' | 'one_off_grant';

// Mirrors v2/data_model/enums.py::BenefitUnit — how to read a benefit's
// per-tier Decimal values.
export type BenefitUnit = 'usd_cents' | 'rate' | 'nights';

// Mirrors v2/data_model/enums.py::MembershipTier (the circle keys).
export type MembershipTier = 'carte' | 'cercle' | 'confidence' | 'cenacle';

// User-facing wording for a benefit, both languages. Bilingual registry
// data (mirrors MultiLanguageString fields) — pick en/kr client-side.
export interface BenefitCopy {
  en: string;
  kr: string;
}

// One active registry entry, tier-agnostic (marketing-page shape).
export interface BenefitItem {
  key: string;
  kind: BenefitKind;
  unit: BenefitUnit | null;
  // Backend Decimals arrive as STRINGS on the wire ("10000" usd_cents,
  // "0.001" rate, "17" nights). Tier-scoped entries only carry their own
  // tier's key; null for structural entries (promo codes, manual grants)
  // whose amounts are DB rows / admin-supplied.
  values_by_tier: Partial<Record<MembershipTier, string>> | null;
  copy: BenefitCopy;
}

// A benefit's value resolved for the caller's own tier. `value` is null
// when the benefit has no declared amount for that tier.
export interface ResolvedBenefit {
  key: string;
  unit: BenefitUnit | null;
  value: string | null;
}

// The authenticated caller's own tier + per-benefit resolved values.
export interface ResolvedBenefits {
  tier: MembershipTier;
  benefits: ResolvedBenefit[];
}

// Response body of GET /api/v2/benefits. `resolved` is populated only when
// a valid bearer token accompanies the request; anonymous callers get null.
export interface BenefitsResponse {
  benefits: BenefitItem[];
  resolved: ResolvedBenefits | null;
}
