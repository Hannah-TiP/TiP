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
  // LEGACY read-only per-lot binding (pre-SMA-329 quotes still in flight).
  // New versions bind points via `applied_points` instead.
  applied_stay_credit_ids?: number[];
  // Wallet points bound to this version (SMA-329 partial wallet spend).
  applied_points?: number;
  schema_version: number;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface QuoteWithVersion {
  quote: Quote;
  current_version?: QuoteVersion | null;
}

// Mirrors tip-backend/v2/services/quote_credit.py::QuoteWalletSummary
// (SMA-329) — the response of GET /quotes/{id}/eligible-credits after the
// per-credit picker was replaced by partial wallet spend. Points are
// integers; Decimals serialize as strings on the v2 wire. Amounts are in
// the quote's currency.
export interface QuoteWalletSummary {
  balance_points: number;
  // Wallet points not reserved by OTHER in-flight quotes.
  available_points: number;
  // Per-booking redemption cap in points (5% of the eligible base by
  // default — the rate comes from the backend config store).
  cap_points: number;
  cap_rate: string;
  // min(available_points, cap_points) — the most this quote can take.
  max_applicable_points: number;
  applied_points: number;
  currency: string;
  applied_amount: string;
  max_applicable_amount: string;
}

// Mirrors tip-backend/v2/api/quote.py::ApplyPointsRequest — body of
// POST /quotes/{id}/credits. `points` omitted/null means "apply the max".
export interface ApplyPointsRequest {
  points?: number | null;
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
