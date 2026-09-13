import { describe, it, expect } from 'vitest';
import { formatPoints, parsePoints, pointsInputError } from '@/lib/points-wallet';

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
