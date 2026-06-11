import { describe, it, expect } from 'vitest';
import {
  STAY_CREDIT_SOURCE_LABELS,
  creditSourceLabel,
  creditsForTrip,
  tripIdFromCredit,
  type StayCredit,
} from '@/types/stay-credit';

function makeCredit(overrides: Partial<StayCredit>): StayCredit {
  return {
    id: 1,
    user_id: 1,
    source: 'payment_points',
    status: 'issued',
    amount_cents: 2000,
    currency: 'USD',
    ...overrides,
  };
}

describe('tripIdFromCredit', () => {
  it('prefers the trip_id field when present', () => {
    const credit = makeCredit({ trip_id: 42, source_ref: 'trip:99:payment_2pct' });
    expect(tripIdFromCredit(credit)).toBe(42);
  });

  it('parses the trip id from a trip:{id}:... source_ref', () => {
    const credit = makeCredit({ source_ref: 'trip:77:first_trip_3pct' });
    expect(tripIdFromCredit(credit)).toBe(77);
  });

  it('returns null for a credit with no trip linkage', () => {
    const credit = makeCredit({ source: 'welcome', source_ref: null });
    expect(tripIdFromCredit(credit)).toBeNull();
  });

  it('returns null for a non-trip source_ref', () => {
    const credit = makeCredit({ source: 'promo_code_redemption', source_ref: 'promo:55' });
    expect(tripIdFromCredit(credit)).toBeNull();
  });
});

describe('creditsForTrip', () => {
  it('returns only credits linked to the given trip', () => {
    // Each trip yields a single post-trip credit, so trip 10 has just the 3%
    // first-trip bonus here; the 2% cashback belongs to a later trip (11).
    const credits: StayCredit[] = [
      makeCredit({ id: 1, source_ref: 'trip:11:payment_2pct', amount_cents: 2000 }),
      makeCredit({
        id: 2,
        source: 'first_trip_cashback',
        source_ref: 'trip:10:first_trip_3pct',
        amount_cents: 3000,
      }),
      makeCredit({ id: 3, source_ref: 'trip:99:payment_2pct' }),
      makeCredit({ id: 4, source: 'welcome', source_ref: null }),
    ];
    const result = creditsForTrip(credits, 10);
    expect(result.map((c) => c.id)).toEqual([2]);
  });

  it('returns an empty array when no credit matches', () => {
    const credits = [makeCredit({ source: 'welcome', source_ref: null })];
    expect(creditsForTrip(credits, 10)).toEqual([]);
  });
});

describe('creditSourceLabel', () => {
  it('appends the redeemed promo code to the localized source label (EN)', () => {
    const credit = makeCredit({
      source: 'promo_code_redemption',
      promo_code: 'WELCOME26',
    });
    expect(creditSourceLabel(credit, true)).toBe('Promo Code · WELCOME26');
  });

  it('appends the redeemed promo code to the localized source label (KR)', () => {
    const credit = makeCredit({
      source: 'promo_code_redemption',
      promo_code: 'WELCOME26',
    });
    expect(creditSourceLabel(credit, false)).toBe('프로모션 코드 · WELCOME26');
  });

  it('falls back to the label alone for old promo credits with no code', () => {
    const credit = makeCredit({ source: 'promo_code_redemption', promo_code: null });
    expect(creditSourceLabel(credit, true)).toBe('Promo Code');
    expect(creditSourceLabel(credit, false)).toBe('프로모션 코드');
  });

  it('never appends a code for non-promo sources', () => {
    const credit = makeCredit({ source: 'welcome' });
    expect(creditSourceLabel(credit, true)).toBe('Welcome');
  });
});

describe('STAY_CREDIT_SOURCE_LABELS', () => {
  it('labels post-trip cashback sources with their percentages', () => {
    expect(STAY_CREDIT_SOURCE_LABELS.payment_points.en).toBe('Trip cashback — 2%');
    expect(STAY_CREDIT_SOURCE_LABELS.first_trip_cashback.en).toBe('First-trip bonus — 3%');
    expect(STAY_CREDIT_SOURCE_LABELS.payment_points.kr).toBe('결제 적립 — 2%');
    expect(STAY_CREDIT_SOURCE_LABELS.first_trip_cashback.kr).toBe('첫 여행 보너스 — 3%');
  });
});
