// Mirrors tip-backend/v2/data_model/schemas/point_transaction.py (SMA-325 —
// the stay-credit table is now the append-only point ledger).
// Mirrors v2/data_model/enums.py::PointSource / PointTransactionKind /
// StayCreditStatus.

import type { BenefitsResponse } from '@/types/v2/benefits';

export type PointSource =
  | 'welcome'
  | 'birthday'
  | 'referral'
  | 'manual'
  | 'payment_points'
  | 'first_trip_cashback'
  | 'review_reward'
  | 'gift'
  | 'promo_code_redemption'
  | 'kb_welcome'
  | 'kb_premium_booking'
  | 'signup'
  | 'partner';

// Mirrors v2/data_model/enums.py::PointTransactionKind — what a ledger row
// does to the balance. Legacy rows predate the ledger and carry null.
export type PointTransactionKind = 'grant' | 'use' | 'cancel' | 'clawback' | 'expire';

// Figure-free qualifier shown next to the source label on the wallet
// history for every non-grant row (SMA-332). `grant` never renders a
// qualifier — the source label alone is the reason. Pinned to the backend
// enum by a drift-guard test.
export const POINT_TRANSACTION_KIND_LABELS: Record<
  PointTransactionKind,
  { en: string; kr: string }
> = {
  grant: { en: 'Earned', kr: '적립' },
  use: { en: 'Used on booking', kr: '예약에 사용' },
  cancel: { en: 'Returned — booking cancelled', kr: '예약 취소로 반환' },
  clawback: { en: 'Clawback', kr: '회수' },
  expire: { en: 'Expired', kr: '만료' },
};

// A row that IS a lot (carries its own `expires_at`): grant lots, legacy
// null-kind grants, and `cancel` rows (points returned at their ORIGINAL
// expiry — SMA-329). Consumption rows (`use`/`clawback`/`expire`) draw a lot
// down and have no expiry of their own.
export function isPointsConsumption(kind: PointTransactionKind | null | undefined): boolean {
  return kind === 'use' || kind === 'clawback' || kind === 'expire';
}

// Grant lots only — `grant` or legacy null-kind rows. Excludes `cancel`
// (a positive return of a `use`, not new earning).
export function isPointsGrantLot(kind: PointTransactionKind | null | undefined): boolean {
  return kind == null || kind === 'grant';
}

// SAFE FALLBACK labels only (SMA-322): when the benefit registry payload is
// available, `pointSourceText` prefers its bilingual copy. These carry
// NO money/rate figures — the earn rate is tiered per membership (SMA-199),
// so any hardcoded percentage here was wrong for most members (SMA-321).
export const POINT_SOURCE_LABELS: Record<PointSource, { en: string; kr: string }> = {
  welcome: { en: 'Welcome', kr: '환영' },
  birthday: { en: 'Birthday', kr: '생일' },
  referral: { en: 'Referral', kr: '추천' },
  manual: { en: 'Concierge', kr: '컨시어지' },
  payment_points: { en: 'Trip cashback', kr: '결제 적립' },
  first_trip_cashback: { en: 'First-trip bonus', kr: '첫 여행 보너스' },
  review_reward: { en: 'Review Reward', kr: '리뷰 보상' },
  gift: { en: 'Gift', kr: '선물' },
  promo_code_redemption: { en: 'Promo Code', kr: '프로모션 코드' },
  kb_welcome: { en: 'KB Welcome', kr: 'KB 웰컴' },
  kb_premium_booking: { en: 'KB Premium Booking', kr: 'KB 프리미엄 예약' },
  // Flat first-signup welcome credit (SMA-267); distinct from `welcome`,
  // which is the Confidence-tier credit.
  signup: { en: 'Signup welcome', kr: '가입 환영' },
  // Partner-granted points (SMA-325 / Points SoT v1.1) — reserved; no grant
  // path exists yet.
  partner: { en: 'Partner', kr: '파트너' },
};

// Maps a ledger source to its benefit-registry entry key (mirrors
// tip-backend/v2/services/benefits/registry.py::entry_for_source — the
// wire payload does not carry `credit_source`, so the FE keeps this map).
// Inactive entries (first_trip_cashback, review_reward, partner_grant) never
// appear in the payload, so those sources always resolve via the fallback
// labels.
export const POINT_SOURCE_BENEFIT_KEYS: Record<PointSource, string> = {
  welcome: 'confidence_welcome',
  birthday: 'birthday_credit',
  referral: 'referral_joiner_credit',
  manual: 'manual_admin_grant',
  payment_points: 'tiered_earn',
  first_trip_cashback: 'first_trip_cashback',
  review_reward: 'review_reward',
  gift: 'gift_credit',
  promo_code_redemption: 'promo_code_redemption',
  kb_welcome: 'kb_welcome',
  kb_premium_booking: 'kb_premium_booking',
  signup: 'signup_welcome',
  partner: 'partner_grant',
};

// LEGACY lifecycle status retained as provenance on the append-only ledger
// (SMA-325): new rows are always written `issued` and never mutated —
// consumption/revocation land as companion rows. Never render it — the
// wallet balance is the backend-derived SUM(delta_points) (SMA-332).
export type StayCreditStatus = 'issued' | 'redeemed' | 'expired' | 'revoked';

// Mirrors v2/data_model/schemas/point_transaction.py::PointTransaction —
// one append-only ledger row. `delta_points` is the signed balance
// contribution (100 P = USD 1); a `use`/`clawback` row names the grant lot
// it draws down via `consumes_transaction_id`. Legacy rows (pre-backfill)
// carry null `delta_points`/`kind`. `amount_cents`/`currency` are
// historical provenance of the original monetary denomination (nullable
// going forward).
export interface PointTransaction {
  id: number;
  user_id: number;
  source: PointSource;
  status: StayCreditStatus;
  delta_points?: number | null;
  kind?: PointTransactionKind | null;
  consumes_transaction_id?: number | null;
  // Backend Decimal, serialized as a JSON number by jsonable_encoder.
  // Display-only; never used for arithmetic on the FE.
  fx_rate_frozen?: number | null;
  amount_cents?: number | null;
  currency?: string | null;
  expires_at?: string | null;
  trip_id?: number | null;
  redeemed_at?: string | null;
  revoked_at?: string | null;
  granted_by_admin_id?: number | null;
  referral_id?: number | null;
  source_ref?: string | null;
  notes?: string | null;
  // The promo code redeemed (e.g. WELCOME26), present only on
  // promo_code_redemption credits. Structured data, not parsed from notes.
  promo_code?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

// Mirrors tip-backend/v2/data_model/schemas/point_transaction.py::PointsLedgerResponse
// — what GET /me/points returns (SMA-332): ONE wallet balance derived
// server-side as SUM(delta_points) (the FE never sums rows itself) plus
// EVERY ledger row — grants AND use/cancel/clawback/expire — newest first.
export interface PointsLedgerResponse {
  user_id: number;
  balance_points: number;
  transactions: PointTransaction[];
}

// Trip-linked credits (post-trip cashback) carry their trip id either on the
// `trip_id` field or encoded in `source_ref` as `trip:{id}:...` (the grant
// service sets source_ref but grant lots carry the trip linkage only in
// source_ref). Resolve either form to a numeric id.
export function tripIdFromCredit(credit: PointTransaction): number | null {
  if (credit.trip_id != null) return credit.trip_id;
  const ref = credit.source_ref;
  if (!ref) return null;
  const match = /^trip:(\d+):/.exec(ref);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isFinite(id) ? id : null;
}

// Filter a credit ledger to the credits earned from a given trip.
export function creditsForTrip<T extends PointTransaction>(credits: T[], tripId: number): T[] {
  return credits.filter((c) => tripIdFromCredit(c) === tripId);
}

// Safe localized label for a ledger source. Prefers the benefit registry
// payload's copy when provided (SMA-322 — the registry is the single source
// of truth for benefit wording/figures); degrades to the static fallback
// label when the payload is absent or has no matching entry, and to the raw
// source string for a new/unknown backend source — never crashes (the map
// has drifted out of sync with the backend enum before — e.g. kb_*).
export function pointSourceText(
  source: PointSource | string,
  en: boolean,
  benefits?: BenefitsResponse | null,
): string {
  const benefitKey = POINT_SOURCE_BENEFIT_KEYS[source as PointSource];
  if (benefits && benefitKey) {
    const item = benefits.benefits.find((b) => b.key === benefitKey);
    if (item) return en ? item.copy.en : item.copy.kr;
  }
  const entry = POINT_SOURCE_LABELS[source as PointSource];
  return entry ? entry[en ? 'en' : 'kr'] : source;
}

// Build the source display label for a credit row: the localized source label,
// suffixed with the redeemed promo code when present (e.g.
// "프로모션 코드 · WELCOME26"). Older promo credits without a structured
// promo_code fall back to the label alone — no hardcoded copy reaches the user.
export function creditSourceLabel(
  credit: PointTransaction,
  en: boolean,
  benefits?: BenefitsResponse | null,
): string {
  const label = pointSourceText(credit.source, en, benefits);
  return credit.promo_code ? `${label} · ${credit.promo_code}` : label;
}

// Safe localized qualifier for a ledger row's `kind`. Sibling of
// `pointSourceText`: never throws on a kind the label map doesn't know
// (backend develop-merges deploy to the shared preview/prod DB before the
// FE catches up — a single drifted row must not take down the wallet page).
// Unknown kind → the raw slug; null/undefined (legacy pre-ledger rows) → null.
export function pointKindText(
  kind: PointTransactionKind | string | null | undefined,
  en: boolean,
): string | null {
  return (
    POINT_TRANSACTION_KIND_LABELS[kind as PointTransactionKind]?.[en ? 'en' : 'kr'] ?? kind ?? null
  );
}

// ── Projected (not-yet-earned) post-trip credits — SMA-274/SMA-276 ─────────

// Mirrors tip-backend/v2/data_model/enums.py::CreditProjectionBlocker.
export type CreditProjectionBlocker = 'trip_not_finished' | 'awaiting_review';

// Mirrors tip-backend/v2/data_model/schemas/point_transaction.py::ProjectedTripEarn.
// A PROJECTION, not a ledger row — never mixed into balances or the credit
// history list.
export interface ProjectedTripEarn {
  trip_id: number;
  trip_title?: string | null;
  eligible_spend_cents: number;
  currency: string;
  // Backend Decimal, serialized as a JSON number by jsonable_encoder
  // (e.g. 0.005). Display-only; never used for arithmetic on the FE.
  tier_rate: number;
  projected_amount_cents: number;
  blocking_reason: CreditProjectionBlocker;
}

// Mirrors tip-backend/v2/data_model/schemas/point_transaction.py::UserCreditProjectionResponse.
export interface UserCreditProjectionResponse {
  user_id: number;
  has_paid_trips: boolean;
  projections: ProjectedTripEarn[];
}

// Mirrors tip-backend/v2/data_model/schemas/referral.py::Referral.
export interface Referral {
  id: number;
  referrer_user_id: number;
  referee_user_id: number;
  referrer_credit_id?: number | null;
  referee_credit_id?: number | null;
  referrer_tier_at_claim?: string | null;
  claimed_at: string;
  created_at?: string | null;
  updated_at?: string | null;
}

// Mirrors tip-backend/v2/api/me_referral.py::MyReferralsResponse.
export interface MyReferralsResponse {
  code: string;
  referrals: Referral[];
  // The referral row where THIS user is the referee, if any. Used by the
  // onboarding step to decide between "you've been invited" vs the input
  // prompt.
  referred_by?: Referral | null;
}

// Mirrors tip-backend/v2/api/me_referral.py::POST /me/referrals/claim
// success envelope. Idempotent: returns referred_by=null when the code
// didn't resolve (stale code, self-referral, etc.) instead of 4xx.
export interface ClaimReferralResponse {
  referred_by: Referral | null;
}

// Mirrors tip-backend/v2/data_model/schemas/promo_code.py::RedeemPromoCodeResponse.
export interface RedeemPromoCodeResponse {
  // credit_amount is a NUMERIC serialized as a string in the JSON envelope.
  credited_amount: string;
  currency: string;
  credit_id: number;
}

// Distinct body_code values returned by POST /me/credits/redeem-code on
// failure (mirrors tip-backend/v2/api/me_credit.py::_REDEEM_ERRORS). The UI
// switches on this to pick the right i18n message.
export type RedeemPromoCodeErrorCode =
  | 'unknown'
  | 'inactive'
  | 'expired'
  | 'max_reached'
  | 'already_redeemed'
  | 'generic';

export const REDEEM_ERROR_CODE_MAP: Record<number, RedeemPromoCodeErrorCode> = {
  4041: 'unknown',
  4001: 'inactive',
  4002: 'expired',
  4003: 'max_reached',
  4004: 'already_redeemed',
};

// Thrown by apiClient.redeemPromoCode so the caller can map the code to a
// localized message.
export class RedeemPromoCodeError extends Error {
  code: RedeemPromoCodeErrorCode;
  constructor(code: RedeemPromoCodeErrorCode, message: string) {
    super(message);
    this.name = 'RedeemPromoCodeError';
    this.code = code;
  }
}
