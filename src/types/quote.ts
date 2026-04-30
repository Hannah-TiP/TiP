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
  schema_version: number;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface QuoteWithVersion {
  quote: Quote;
  current_version?: QuoteVersion | null;
}
