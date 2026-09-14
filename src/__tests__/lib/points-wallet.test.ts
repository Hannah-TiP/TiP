import { describe, it, expect } from 'vitest';
import {
  formatPoints,
  formatSignedPoints,
  parsePoints,
  pointsInputError,
  pointsToUsdApprox,
  projectedPoints,
  redeemedPoints,
  usdCentsToPoints,
} from '@/lib/points-wallet';
import type { ProjectedTripEarn, RedeemPromoCodeResponse } from '@/types/stay-credit';

describe('pointsInputError', () => {
  it('accepts whole numbers in [1, max]', () => {
    expect(pointsInputError('1', 2500)).toBeNull();
    expect(pointsInputError('2500', 2500)).toBeNull();
    expect(pointsInputError(' 1000 ', 2500)).toBeNull();
  });

  it('rejects zero, negatives, decimals, and non-numeric input', () => {
    expect(pointsInputError('0', 2500)).toBe('invalid');
    expect(pointsInputError('-5', 2500)).toBe('invalid');
    expect(pointsInputError('12.5', 2500)).toBe('invalid');
    expect(pointsInputError('abc', 2500)).toBe('invalid');
    expect(pointsInputError('', 2500)).toBe('invalid');
    expect(pointsInputError('1e3', 2500)).toBe('invalid');
  });

  it('rejects amounts above the max applicable', () => {
    expect(pointsInputError('2501', 2500)).toBe('exceeds');
    expect(pointsInputError('999999', 2500)).toBe('exceeds');
  });
});

describe('parsePoints', () => {
  it('parses valid whole numbers', () => {
    expect(parsePoints('2500')).toBe(2500);
    expect(parsePoints(' 42 ')).toBe(42);
  });

  it('returns null for anything else', () => {
    expect(parsePoints('12.5')).toBeNull();
    expect(parsePoints('-1')).toBeNull();
    expect(parsePoints('')).toBeNull();
  });
});

describe('formatPoints', () => {
  it('renders the point unit with thousands separators', () => {
    expect(formatPoints(2500)).toBe('2,500 P');
    expect(formatPoints(0)).toBe('0 P');
  });
});

describe('formatSignedPoints', () => {
  it('prefixes positive deltas with + and negative deltas with a real minus sign (U+2212)', () => {
    expect(formatSignedPoints(10000)).toBe('+10,000 P');
    expect(formatSignedPoints(-1200)).toBe('\u22121,200 P');
    expect(formatSignedPoints(-1200)).not.toContain('-');
  });

  it('renders zero unsigned and a null/invalid delta as an em dash (never NaN)', () => {
    expect(formatSignedPoints(0)).toBe('0 P');
    expect(formatSignedPoints(null)).toBe('—');
    expect(formatSignedPoints(undefined)).toBe('—');
    expect(formatSignedPoints(Number.NaN)).toBe('—');
  });
});

describe('pointsToUsdApprox', () => {
  it('floors the balance divided by the registry point unit (§6: 24,500 P ≈ USD 245)', () => {
    expect(pointsToUsdApprox(24500, 100)).toBe(245);
    expect(pointsToUsdApprox(24599, 100)).toBe(245);
    expect(pointsToUsdApprox(0, 100)).toBe(0);
  });

  it('returns null when the unit is absent or not a positive finite number', () => {
    expect(pointsToUsdApprox(24500, null)).toBeNull();
    expect(pointsToUsdApprox(24500, undefined)).toBeNull();
    expect(pointsToUsdApprox(24500, 0)).toBeNull();
    expect(pointsToUsdApprox(24500, -100)).toBeNull();
    expect(pointsToUsdApprox(24500, Number.NaN)).toBeNull();
    expect(pointsToUsdApprox(Number.NaN, 100)).toBeNull();
  });
});

describe('usdCentsToPoints', () => {
  it('converts cents to whole points via the registry point unit, flooring', () => {
    expect(usdCentsToPoints(1250, 100)).toBe(1250);
    expect(usdCentsToPoints(500, 100)).toBe(500);
    expect(usdCentsToPoints(1, 100)).toBe(1);
    // Binary-float trap: 29 / 100 * 100 === 28.999… — must still be 29 P.
    expect(usdCentsToPoints(29, 100)).toBe(29);
    expect(usdCentsToPoints(57, 100)).toBe(57);
    // A non-100 unit still floors to whole points.
    expect(usdCentsToPoints(1250, 10)).toBe(125);
    expect(usdCentsToPoints(1255, 10)).toBe(125);
  });

  it('returns null without a valid unit — never a guessed ratio', () => {
    expect(usdCentsToPoints(1250, null)).toBeNull();
    expect(usdCentsToPoints(1250, undefined)).toBeNull();
    expect(usdCentsToPoints(1250, 0)).toBeNull();
    expect(usdCentsToPoints(Number.NaN, 100)).toBeNull();
  });
});

function projection(overrides: Partial<ProjectedTripEarn>): ProjectedTripEarn {
  return {
    trip_id: 1,
    eligible_spend_cents: 250000,
    currency: 'USD',
    tier_rate: 0.005,
    projected_amount_cents: 1250,
    blocking_reason: 'awaiting_completion',
    ...overrides,
  };
}

describe('projectedPoints', () => {
  it('prefers the backend projected_points regardless of currency or unit', () => {
    expect(projectedPoints(projection({ projected_points: 1250 }), 100)).toBe(1250);
    expect(projectedPoints(projection({ projected_points: 1250, currency: 'EUR' }), null)).toBe(
      1250,
    );
  });

  it('falls back to the USD cents → points conversion when projected_points is absent', () => {
    expect(projectedPoints(projection({}), 100)).toBe(1250);
  });

  it('never invents an FX rate for a non-USD legacy projection', () => {
    expect(projectedPoints(projection({ currency: 'EUR' }), 100)).toBeNull();
  });

  it('is figure-less for a USD legacy projection without a point unit', () => {
    expect(projectedPoints(projection({}), null)).toBeNull();
  });
});

function redemption(overrides: Partial<RedeemPromoCodeResponse>): RedeemPromoCodeResponse {
  return { credited_amount: '20.00', currency: 'USD', credit_id: 9, ...overrides };
}

describe('redeemedPoints', () => {
  it('prefers the backend credited_points', () => {
    expect(redeemedPoints(redemption({ credited_points: 2000 }), null)).toBe(2000);
    expect(redeemedPoints(redemption({ credited_points: 2000, currency: 'EUR' }), 100)).toBe(2000);
  });

  it('falls back to the USD amount via the point unit (cent-exact)', () => {
    expect(redeemedPoints(redemption({}), 100)).toBe(2000);
    expect(redeemedPoints(redemption({ credited_amount: '12.5' }), 100)).toBe(1250);
    // Rounded to cents first so binary-float amounts never floor a point away.
    expect(redeemedPoints(redemption({ credited_amount: '0.29' }), 100)).toBe(29);
  });

  it('returns null for a non-USD legacy response or a missing unit', () => {
    expect(redeemedPoints(redemption({ currency: 'EUR' }), 100)).toBeNull();
    expect(redeemedPoints(redemption({}), null)).toBeNull();
    expect(redeemedPoints(redemption({ credited_amount: 'abc' }), 100)).toBeNull();
  });
});
