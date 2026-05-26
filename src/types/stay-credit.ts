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
  | 'gift';

export const STAY_CREDIT_SOURCE_LABELS: Record<StayCreditSource, { en: string; kr: string }> = {
  welcome: { en: 'Welcome', kr: '환영' },
  birthday: { en: 'Birthday', kr: '생일' },
  referral: { en: 'Referral', kr: '추천' },
  manual: { en: 'Concierge', kr: '컨시어지' },
  payment_points: { en: 'Payment Points', kr: '결제 적립' },
  first_trip_cashback: { en: 'First Trip Cashback', kr: '첫 여행 캐시백' },
  review_reward: { en: 'Review Reward', kr: '리뷰 보상' },
  gift: { en: 'Gift', kr: '선물' },
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
  created_at?: string | null;
  updated_at?: string | null;
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
