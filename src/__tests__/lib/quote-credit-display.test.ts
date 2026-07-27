import { describe, it, expect } from 'vitest';
import {
  appliedStayCreditAmount,
  isStayCreditDiscount,
  isZeroTotal,
  STAY_CREDIT_KIND,
  type QuoteDiscount,
  type QuoteTotalSnapshot,
} from '@/types/quote';

function snapshot(overrides: Partial<QuoteTotalSnapshot> = {}): QuoteTotalSnapshot {
  return {
    currency: 'USD',
    subtotal: '200.00',
    fees: [],
    discounts: [],
    total: '100.00',
    ...overrides,
  };
}

describe('isStayCreditDiscount', () => {
  it('matches the kind marker regardless of label', () => {
    const line: QuoteDiscount = {
      label: 'Anything at all',
      amount: '100.00',
      kind: STAY_CREDIT_KIND,
    };
    expect(isStayCreditDiscount(line)).toBe(true);
  });

  it('falls back to the legacy "Stay credit " label prefix for pre-kind snapshots', () => {
    const legacy: QuoteDiscount = {
      label: 'Stay credit (birthday, USD 100.00)',
      amount: '100.00',
    };
    expect(isStayCreditDiscount(legacy)).toBe(true);
  });

  it('does not match benefit-credit or free-form discount lines', () => {
    const benefit: QuoteDiscount = {
      label: 'Benefit credit (carte, USD 100.00)',
      amount: '100.00',
      kind: 'benefit_credit',
    };
    const promo: QuoteDiscount = { label: 'Promo', amount: '10.00' };
    expect(isStayCreditDiscount(benefit)).toBe(false);
    expect(isStayCreditDiscount(promo)).toBe(false);
  });
});

describe('appliedStayCreditAmount', () => {
  it('returns the stay-credit line amount (the amount actually applied)', () => {
    const snap = snapshot({
      discounts: [
        { label: 'Benefit credit (carte, USD 100.00)', amount: '100.00', kind: 'benefit_credit' },
        {
          label: 'Stay credit (manual, USD 100.00)',
          amount: '100.00',
          kind: STAY_CREDIT_KIND,
        },
      ],
      total: '0.00',
    });
    expect(appliedStayCreditAmount(snap)).toBe('100.00');
  });

  it('returns null when no stay-credit line is present', () => {
    const snap = snapshot({
      discounts: [
        { label: 'Benefit credit (carte, USD 100.00)', amount: '100.00', kind: 'benefit_credit' },
      ],
    });
    expect(appliedStayCreditAmount(snap)).toBeNull();
  });
});

describe('isZeroTotal', () => {
  it('is true for a zero total', () => {
    expect(isZeroTotal(snapshot({ total: '0.00' }))).toBe(true);
    expect(isZeroTotal(snapshot({ total: '0' }))).toBe(true);
  });

  it('is false when an amount is still owed', () => {
    expect(isZeroTotal(snapshot({ total: '100.00' }))).toBe(false);
    expect(isZeroTotal(snapshot({ total: '0.01' }))).toBe(false);
  });
});
