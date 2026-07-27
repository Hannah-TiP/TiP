export type QuoteStatus = 'DRAFT' | 'SENT' | 'PAID' | 'REJECTED' | 'EXPIRED';

export interface QuoteLineItem {
  day_index: number;
  item_index: number;
  label: string;
  amount: string;
  currency: string;
  quantity?: number;
  notes?: string | null;
}

export interface QuoteFee {
  label: string;
  amount: string;
}

export interface QuoteDiscount {
  label: string;
  amount: string;
  // Machine-readable marker for system-managed discount kinds
  // ('benefit_credit' | 'stay_credit'); legacy snapshots carry label-only
  // lines with no kind.
  kind?: string | null;
}

export interface QuoteTotalSnapshot {
  currency: string;
  subtotal: string;
  fees: QuoteFee[];
  discounts: QuoteDiscount[];
  total: string;
}

export interface Quote {
  id: number;
  trip_id: number;
  trip_version_id: number;
  user_id: number;
  current_quote_version_id?: number | null;
  status: QuoteStatus;
  expires_at?: string | null;
  sent_at?: string | null;
  paid_at?: string | null;
  schema_version: number;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface QuoteVersion {
  id: number;
  quote_id: number;
  version_number: number;
  created_by_admin_id?: number | null;
  line_items: QuoteLineItem[];
  total_snapshot: QuoteTotalSnapshot;
  // Stay credits applied to this version. Single-item max today (API
  // enforced), but the shape is a list so multi-credit stacking can land
  // later without a client change.
  applied_stay_credit_ids?: number[];
  schema_version: number;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface QuoteWithVersion {
  quote: Quote;
  current_version?: QuoteVersion | null;
}

// Markers mirrored from the backend (v2/services/quote_credit.py). New
// stay-credit discount lines carry kind='stay_credit'; snapshots authored
// before SMA-237 are identified by the label prefix only.
export const STAY_CREDIT_KIND = 'stay_credit';
const STAY_CREDIT_LABEL_PREFIX = 'Stay credit ';

/** True when the discount line is the applied ledger stay credit. */
export function isStayCreditDiscount(discount: QuoteDiscount): boolean {
  return discount.kind === STAY_CREDIT_KIND || discount.label.startsWith(STAY_CREDIT_LABEL_PREFIX);
}

/**
 * Amount of the stay-credit discount actually applied to this snapshot
 * (clamped to the amount owed — SMA-237), or null when no credit line is
 * present. Denominated in the snapshot's currency.
 */
export function appliedStayCreditAmount(snapshot: QuoteTotalSnapshot): string | null {
  const line = snapshot.discounts.find(isStayCreditDiscount);
  return line ? line.amount : null;
}

/** True when nothing is owed on the snapshot (total is 0). */
export function isZeroTotal(snapshot: QuoteTotalSnapshot): boolean {
  return Number(snapshot.total) === 0;
}
