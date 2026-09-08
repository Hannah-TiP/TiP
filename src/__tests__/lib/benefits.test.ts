import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { BenefitsResponse } from '@/types/v2/benefits';
import {
  benefitTierValue,
  clearBenefitsCache,
  fetchBenefits,
  fillVars,
  findBenefit,
  formatRatePercent,
  formatUsdCents,
  formatWholeNumber,
  membershipBenefitFigures,
  resolvedBenefitValue,
} from '@/lib/benefits';
import {
  FALLBACK_BENEFIT_CREDIT,
  FALLBACK_CERCLE_LOYALTY_NIGHTS,
  FALLBACK_CONFIDENCE_SIGNATURE_NIGHTS,
  FALLBACK_CONFIDENCE_WELCOME,
} from '@/lib/benefits-fallback';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({
  apiClient: { getBenefits: vi.fn() },
}));

const getBenefitsMock = vi.mocked(apiClient.getBenefits);

// Wire-shaped fixture mirroring the PR 2 contract tests
// (tip-backend/tests/integration/test_v2_benefits_api.py): Decimals are
// STRINGS on the wire.
function makePayload(overrides: Partial<BenefitsResponse> = {}): BenefitsResponse {
  return {
    benefits: [
      {
        key: 'benefit_credit',
        kind: 'per_booking_discount',
        unit: 'usd_cents',
        values_by_tier: {
          carte: '10000',
          cercle: '15000',
          confidence: '20000',
          cenacle: '40000',
        },
        copy: { en: 'Booking credit at your tier.', kr: '등급별 베네핏 크레딧.' },
      },
      {
        key: 'tiered_earn',
        kind: 'earn_rate',
        unit: 'rate',
        values_by_tier: {
          carte: '0.001',
          cercle: '0.005',
          confidence: '0.01',
          cenacle: '0.015',
        },
        copy: { en: 'Earn stay credit on every reviewed trip.', kr: '여행 후기 작성 시 적립.' },
      },
      {
        key: 'confidence_welcome',
        kind: 'one_off_grant',
        unit: 'usd_cents',
        values_by_tier: { confidence: '50000' },
        copy: { en: 'Confidence welcome credit.', kr: 'Confidence 웰컴 크레딧.' },
      },
      {
        key: 'cercle_loyalty_night',
        kind: 'earn_rate',
        unit: 'nights',
        values_by_tier: { cercle: '17' },
        copy: { en: 'Cercle Loyalty Night.', kr: 'Cercle 로열티 나이트.' },
      },
      {
        key: 'confidence_signature_night',
        kind: 'earn_rate',
        unit: 'nights',
        values_by_tier: { confidence: '10' },
        copy: { en: 'Confidence Signature Night.', kr: 'Confidence 시그니처 나이트.' },
      },
      {
        key: 'promo_code_redemption',
        kind: 'one_off_grant',
        unit: null,
        values_by_tier: null,
        copy: { en: 'Redeem a promo code.', kr: '프로모션 코드 등록.' },
      },
    ],
    resolved: null,
    ...overrides,
  };
}

beforeEach(() => {
  clearBenefitsCache();
  getBenefitsMock.mockReset();
});

afterEach(() => {
  clearBenefitsCache();
});

describe('formatRatePercent', () => {
  it('formats wire rate strings without float drift', () => {
    expect(formatRatePercent('0.001')).toBe('0.1%');
    expect(formatRatePercent('0.005')).toBe('0.5%');
    expect(formatRatePercent('0.01')).toBe('1%');
    expect(formatRatePercent('0.015')).toBe('1.5%');
  });

  it('returns null for an unparsable value', () => {
    expect(formatRatePercent('not-a-rate')).toBeNull();
    expect(formatRatePercent('')).toBeNull();
  });
});

describe('formatUsdCents', () => {
  it('formats whole-dollar cents without decimals', () => {
    expect(formatUsdCents('10000')).toBe('$100');
    expect(formatUsdCents('40000')).toBe('$400');
    expect(formatUsdCents('3000000')).toBe('$30,000');
  });

  it('keeps cents when the amount is not whole dollars', () => {
    expect(formatUsdCents('10050')).toBe('$100.50');
  });

  it('returns null for an unparsable value', () => {
    expect(formatUsdCents('oops')).toBeNull();
  });
});

describe('formatWholeNumber', () => {
  it('normalizes wire number strings', () => {
    expect(formatWholeNumber('17')).toBe('17');
  });

  it('returns null for an unparsable value', () => {
    expect(formatWholeNumber('seventeen')).toBeNull();
  });
});

describe('fillVars', () => {
  it('substitutes known placeholders and leaves unknown ones visible', () => {
    expect(fillVars('Up to {credit} per booking ({missing})', { credit: '$150' })).toBe(
      'Up to $150 per booking ({missing})',
    );
  });
});

describe('payload lookups', () => {
  it('finds benefits and tier values', () => {
    const payload = makePayload();
    expect(findBenefit(payload, 'tiered_earn')?.unit).toBe('rate');
    expect(findBenefit(payload, 'nope')).toBeNull();
    expect(benefitTierValue(payload, 'benefit_credit', 'cenacle')).toBe('40000');
    // tier-scoped entry: no value outside its own tier
    expect(benefitTierValue(payload, 'cercle_loyalty_night', 'carte')).toBeNull();
    // structural entry: no declared values at all
    expect(benefitTierValue(payload, 'promo_code_redemption', 'carte')).toBeNull();
    expect(benefitTierValue(null, 'benefit_credit', 'carte')).toBeNull();
  });

  it('reads the resolved block only when present', () => {
    expect(resolvedBenefitValue(makePayload(), 'tiered_earn')).toBeNull();
    const authed = makePayload({
      resolved: {
        tier: 'carte',
        benefits: [{ key: 'tiered_earn', unit: 'rate', value: '0.001' }],
      },
    });
    expect(resolvedBenefitValue(authed, 'tiered_earn')).toBe('0.001');
    expect(resolvedBenefitValue(authed, 'benefit_credit')).toBeNull();
  });
});

describe('membershipBenefitFigures', () => {
  it('renders every figure from the payload when available', () => {
    const figures = membershipBenefitFigures(makePayload());
    expect(figures.benefitCredit).toEqual({
      carte: '$100',
      cercle: '$150',
      confidence: '$200',
      cenacle: '$400',
    });
    expect(figures.confidenceWelcome).toBe('$500');
    expect(figures.cercleLoyaltyNights).toBe('17');
    expect(figures.confidenceSignatureNights).toBe('10');
  });

  it('degrades to the static fallbacks when the payload is unavailable', () => {
    const figures = membershipBenefitFigures(null);
    expect(figures.benefitCredit).toEqual(FALLBACK_BENEFIT_CREDIT);
    expect(figures.confidenceWelcome).toBe(FALLBACK_CONFIDENCE_WELCOME);
    expect(figures.cercleLoyaltyNights).toBe(FALLBACK_CERCLE_LOYALTY_NIGHTS);
    expect(figures.confidenceSignatureNights).toBe(FALLBACK_CONFIDENCE_SIGNATURE_NIGHTS);
  });

  it('falls back per-figure when the payload lacks an entry', () => {
    const payload = makePayload();
    payload.benefits = payload.benefits.filter((b) => b.key !== 'confidence_welcome');
    const figures = membershipBenefitFigures(payload);
    expect(figures.confidenceWelcome).toBe(FALLBACK_CONFIDENCE_WELCOME);
    // the rest still come from the payload
    expect(figures.benefitCredit.cercle).toBe('$150');
  });
});

describe('fetchBenefits', () => {
  it('fetches once and shares the cached promise across consumers', async () => {
    getBenefitsMock.mockResolvedValue(makePayload());
    const [first, second] = await Promise.all([fetchBenefits(), fetchBenefits()]);
    expect(first).not.toBeNull();
    expect(second).toBe(first);
    expect(getBenefitsMock).toHaveBeenCalledTimes(1);
  });

  it('resolves null on failure and clears the cache so a later mount retries', async () => {
    getBenefitsMock.mockRejectedValueOnce(new Error('down'));
    expect(await fetchBenefits()).toBeNull();
    getBenefitsMock.mockResolvedValueOnce(makePayload());
    expect(await fetchBenefits()).not.toBeNull();
    expect(getBenefitsMock).toHaveBeenCalledTimes(2);
  });
});
