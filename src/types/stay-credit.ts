// Mirrors tip-backend/v2/data_model/schemas/stay_credit.py
// Mirrors v2/data_model/enums.py::StayCreditSource / StayCreditStatus.

export type StayCreditSource =
  | 'welcome'
  | 'birthday'
  | 'referral'
  | 'manual'
  | 'payment_points'
  | 'first_trip_cashback'
  | 'review_reward'
  | 'gift'
  | 'promo_code_redemption';

export const STAY_CREDIT_SOURCE_LABELS: Record<StayCreditSource, { en: string; kr: string }> = {
  welcome: { en: 'Welcome', kr: '환영' },
  birthday: { en: 'Birthday', kr: '생일' },
  referral: { en: 'Referral', kr: '추천' },
  manual: { en: 'Concierge', kr: '컨시어지' },
  payment_points: { en: 'Trip cashback — 2%', kr: '결제 적립 — 2%' },
  first_trip_cashback: { en: 'First-trip bonus — 3%', kr: '첫 여행 보너스 — 3%' },
  review_reward: { en: 'Review Reward', kr: '리뷰 보상' },
  gift: { en: 'Gift', kr: '선물' },
  promo_code_redemption: { en: 'Promo Code', kr: '프로모션 코드' },
};

export type StayCreditStatus = 'issued' | 'redeemed' | 'expired' | 'revoked';

export const STAY_CREDIT_STATUS_LABELS: Record<StayCreditStatus, { en: string; kr: string }> = {
  issued: { en: 'Available', kr: '사용 가능' },
  redeemed: { en: 'Used', kr: '사용됨' },
  expired: { en: 'Expired', kr: '만료' },
  revoked: { en: 'Revoked', kr: '취소됨' },
};

export interface StayCredit {
  id: number;
  user_id: number;
  source: StayCreditSource;
  status: StayCreditStatus;
  amount_cents: number;
  currency: string;
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

// Trip-linked credits (post-trip cashback) carry their trip id either on the
// `trip_id` field or encoded in `source_ref` as `trip:{id}:...` (the grant
// service sets source_ref but the CreateStayCredit DTO has no trip_id, so
// today only source_ref is populated). Resolve either form to a numeric id.
export function tripIdFromCredit(credit: StayCredit): number | null {
  if (credit.trip_id != null) return credit.trip_id;
  const ref = credit.source_ref;
  if (!ref) return null;
  const match = /^trip:(\d+):/.exec(ref);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isFinite(id) ? id : null;
}

// Filter a credit ledger to the credits earned from a given trip.
export function creditsForTrip(credits: StayCredit[], tripId: number): StayCredit[] {
  return credits.filter((c) => tripIdFromCredit(c) === tripId);
}

// Build the source display label for a credit row: the localized source label,
// suffixed with the redeemed promo code when present (e.g.
// "프로모션 코드 · WELCOME26"). Older promo credits without a structured
// promo_code fall back to the label alone — no hardcoded copy reaches the user.
export function creditSourceLabel(credit: StayCredit, en: boolean): string {
  const label = STAY_CREDIT_SOURCE_LABELS[credit.source][en ? 'en' : 'kr'];
  return credit.promo_code ? `${label} · ${credit.promo_code}` : label;
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

// Mirrors tip-backend/v2/services/quote_credit.py::EligibleCredit.
// A stay credit plus its FX-converted amount in the target quote's
// currency, ready to render in the "Apply credit" picker.
export interface EligibleCredit extends StayCredit {
  converted_amount: string;
  converted_currency: string;
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
