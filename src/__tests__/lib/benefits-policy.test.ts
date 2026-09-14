import { describe, it, expect } from 'vitest';
import type { BenefitItem, BenefitsResponse } from '@/types/v2/benefits';
import {
  POINTS_POLICY_BENEFIT_KEYS,
  flatBenefitValue,
  formatPointsFigure,
  pointValidityMonths,
  reviewRewardFigures,
} from '@/lib/benefits';

// SMA-359: the admin-configurable points policy (review reward, validity,
// redemption cap) rides on GET /api/v2/benefits as tier-agnostic entries.
// Every helper must tolerate their absence (older backend) with null.

function policyEntry(key: string, unit: BenefitItem['unit'], value: string): BenefitItem {
  return {
    key,
    kind: 'one_off_grant',
    unit,
    values_by_tier: { carte: value, cercle: value, confidence: value, cenacle: value },
    copy: { en: key, kr: key },
  };
}

const FULL_POLICY: BenefitsResponse = {
  benefits: [
    policyEntry(POINTS_POLICY_BENEFIT_KEYS.reviewRewardText, 'points', '500'),
    policyEntry(POINTS_POLICY_BENEFIT_KEYS.reviewRewardPhoto, 'points', '1000'),
    policyEntry(POINTS_POLICY_BENEFIT_KEYS.pointValidityMonths, 'months', '24'),
    policyEntry(POINTS_POLICY_BENEFIT_KEYS.redemptionCap, 'rate', '0.05'),
  ],
  resolved: null,
};

describe('flatBenefitValue', () => {
  it('prefers the resolved value, then any declared tier value', () => {
    const withResolved: BenefitsResponse = {
      benefits: [policyEntry('point_validity_months', 'months', '24')],
      resolved: {
        tier: 'cercle',
        benefits: [{ key: 'point_validity_months', unit: 'months', value: '36' }],
      },
    };
    expect(flatBenefitValue(withResolved, 'point_validity_months')).toBe('36');
    expect(flatBenefitValue(FULL_POLICY, 'point_validity_months')).toBe('24');
    // A partial tier map still yields the flat value.
    expect(
      flatBenefitValue(
        {
          benefits: [
            {
              ...policyEntry('review_reward_text', 'points', '500'),
              values_by_tier: { cenacle: '500' },
            },
          ],
          resolved: null,
        },
        'review_reward_text',
      ),
    ).toBe('500');
  });

  it('returns null when the payload / entry / values are absent', () => {
    expect(flatBenefitValue(null, 'redemption_cap')).toBeNull();
    expect(flatBenefitValue({ benefits: [], resolved: null }, 'redemption_cap')).toBeNull();
    expect(
      flatBenefitValue(
        {
          benefits: [{ ...policyEntry('redemption_cap', 'rate', '0.05'), values_by_tier: null }],
          resolved: null,
        },
        'redemption_cap',
      ),
    ).toBeNull();
  });
});

describe('formatPointsFigure', () => {
  it('groups thousands without a unit (the template carries " P")', () => {
    expect(formatPointsFigure('500')).toBe('500');
    expect(formatPointsFigure('1000')).toBe('1,000');
    expect(formatPointsFigure('1000.00')).toBe('1,000');
  });

  it('returns null for unparsable or negative values', () => {
    expect(formatPointsFigure('')).toBeNull();
    expect(formatPointsFigure('abc')).toBeNull();
    expect(formatPointsFigure('-5')).toBeNull();
  });
});

describe('reviewRewardFigures', () => {
  it('reads both reward amounts from the policy entries', () => {
    expect(reviewRewardFigures(FULL_POLICY)).toEqual({ text: '500', photo: '1,000' });
  });

  it('is null when either entry is missing or unparsable (figure-free copy)', () => {
    expect(reviewRewardFigures(null)).toBeNull();
    expect(
      reviewRewardFigures({
        benefits: [policyEntry(POINTS_POLICY_BENEFIT_KEYS.reviewRewardText, 'points', '500')],
        resolved: null,
      }),
    ).toBeNull();
    expect(
      reviewRewardFigures({
        benefits: [
          policyEntry(POINTS_POLICY_BENEFIT_KEYS.reviewRewardText, 'points', 'n/a'),
          policyEntry(POINTS_POLICY_BENEFIT_KEYS.reviewRewardPhoto, 'points', '1000'),
        ],
        resolved: null,
      }),
    ).toBeNull();
  });
});

describe('pointValidityMonths', () => {
  it('reads the validity window as a whole number of months', () => {
    expect(pointValidityMonths(FULL_POLICY)).toBe('24');
    expect(
      pointValidityMonths({
        benefits: [policyEntry(POINTS_POLICY_BENEFIT_KEYS.pointValidityMonths, 'months', '12.0')],
        resolved: null,
      }),
    ).toBe('12');
  });

  it('is null when absent or not a positive whole number', () => {
    expect(pointValidityMonths(null)).toBeNull();
    expect(pointValidityMonths({ benefits: [], resolved: null })).toBeNull();
    for (const bad of ['0', '-3', '1.5', 'abc']) {
      expect(
        pointValidityMonths({
          benefits: [policyEntry(POINTS_POLICY_BENEFIT_KEYS.pointValidityMonths, 'months', bad)],
          resolved: null,
        }),
        `value ${bad}`,
      ).toBeNull();
    }
  });
});
