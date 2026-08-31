// The SANCTIONED home for membership money literals (SMA-322 PR 3).
//
// Every customer-facing benefit figure normally renders from the
// GET /api/v2/benefits payload (the declarative benefit registry). Two
// cases still need constants:
//
//   1. FALLBACK_* values — used when the endpoint is unavailable so the
//      membership/credit pages degrade to today's numbers instead of
//      rendering blank or crashing.
//   2. Figures the registry does NOT serve (qualifying spend thresholds,
//      annual fees) — always sourced here until the backend registry
//      grows entries for them.
//
// The guard vitest (src/__tests__/guards/no-hardcoded-benefit-figures.test.ts)
// bans `[%$₩]<digit>` literals in the page/type sources and deliberately
// EXCLUDES this file. Do not add benefit figures anywhere else.

import type { MembershipTier } from '@/types/v2/benefits';

type Bilingual = { en: string; kr: string };

// Per-booking Benefit Credit by tier (registry key `benefit_credit`).
export const FALLBACK_BENEFIT_CREDIT: Record<MembershipTier, string> = {
  carte: '$100',
  cercle: '$150',
  confidence: '$200',
  cenacle: '$400',
};

// Confidence one-time welcome credit (registry key `confidence_welcome`).
export const FALLBACK_CONFIDENCE_WELCOME = '$500';

// Free-night thresholds, in nights (registry keys `cercle_loyalty_night` /
// `confidence_signature_night`).
export const FALLBACK_CERCLE_LOYALTY_NIGHTS = '17';
export const FALLBACK_CONFIDENCE_SIGNATURE_NIGHTS = '10';

// ── Not served by GET /api/v2/benefits — always sourced here ──────────────

// Trailing-annual TiP spend that qualifies for each circle (SMA-203).
export const CERCLE_ANNUAL_SPEND = '$30,000';
export const CONFIDENCE_ANNUAL_SPEND = '$70,000';

// Annual membership fees (marketing copy, bilingual).
export const CONFIDENCE_ANNUAL_FEE: Bilingual = {
  en: '₩9,500,000 / year (approx. $6,500)',
  kr: '연 ₩9,500,000',
};
export const CENACLE_ANNUAL_FEE: Bilingual = {
  en: '₩20,000,000 / year (approx. $15,000)',
  kr: '연 ₩20,000,000',
};
