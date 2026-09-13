import { describe, it, expect } from 'vitest';
import {
  formatPoints,
  formatSignedPoints,
  parsePoints,
  pointsInputError,
  pointsToUsdApprox,
} from '@/lib/points-wallet';

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
