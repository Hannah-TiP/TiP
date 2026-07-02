// Membership free-night benefit types (SMA-202).
// Mirror the backend v2 Pydantic response shapes 1:1.

export type FreeNightKind = 'accrual_progress' | 'awarded';
export type FreeNightStatus = 'awarded' | 'redeemed' | 'expired';
export type MembershipTier = 'carte' | 'cercle' | 'confidence' | 'cenacle';

export interface MembershipFreeNight {
  id: number;
  user_id: number;
  tier_at_award: MembershipTier;
  kind: FreeNightKind;
  status: FreeNightStatus;
  accrual_period: number | null;
  qualifying_nights: number;
  awarded_at: string | null;
  redeemed_at: string | null;
  fulfilled_by_admin_id: number | null;
  source_ref: string | null;
  notes: string | null;
  schema_version: number;
  created_at: string | null;
  updated_at: string | null;
}

// Member-facing (my-page) summary — GET /api/v2/me/free-nights.
export interface MemberFreeNightSummary {
  tier: MembershipTier | null;
  accrues: boolean;
  threshold: number | null;
  current_nights: number | null;
  nights_to_next: number | null;
  awarded: MembershipFreeNight[];
}
