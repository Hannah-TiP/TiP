import { describe, it, expect } from 'vitest';
import {
  STAY_CREDIT_SOURCE_BENEFIT_KEYS,
  STAY_CREDIT_SOURCE_LABELS,
  creditSourceLabel,
  creditsForTrip,
  stayCreditSourceText,
  tripIdFromCredit,
  type StayCredit,
} from '@/types/stay-credit';
import type { BenefitsResponse } from '@/types/v2/benefits';

// Minimal registry payload (SMA-322) for label-resolution tests.
const BENEFITS_PAYLOAD: BenefitsResponse = {
  benefits: [
    {
      key: 'tiered_earn',
      kind: 'earn_rate',
      unit: 'rate',
      values_by_tier: { carte: '0.001' },
      copy: {
        en: 'Earn stay credit on every completed, reviewed trip.',
        kr: '여행 후기를 남기면 등급별로 크레딧이 적립됩니다.',
      },
    },
    {
      key: 'signup_welcome',
      kind: 'one_off_grant',
      unit: 'usd_cents',
      values_by_tier: { carte: '10000' },
      copy: {
        en: 'A welcome credit when you join Travel in Your Pocket.',
        kr: 'Travel in Your Pocket 가입 시 웰컴 크레딧을 드립니다.',
      },
    },
  ],
  resolved: null,
};

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

  it('labels KB benefit sources without crashing (regression: credit page white-screen)', () => {
    expect(creditSourceLabel(makeCredit({ source: 'kb_welcome' }), true)).toBe('KB Welcome');
    expect(creditSourceLabel(makeCredit({ source: 'kb_welcome' }), false)).toBe('KB 웰컴');
    expect(creditSourceLabel(makeCredit({ source: 'kb_premium_booking' }), true)).toBe(
      'KB Premium Booking',
    );
  });
});

describe('stayCreditSourceText', () => {
  it('returns the localized label for a known source', () => {
    expect(stayCreditSourceText('birthday', true)).toBe('Birthday');
    expect(stayCreditSourceText('birthday', false)).toBe('생일');
  });

  it('labels the signup welcome credit (regression: travel-history detail crash)', () => {
    expect(stayCreditSourceText('signup', true)).toBe('Signup welcome');
    expect(stayCreditSourceText('signup', false)).toBe('가입 환영');
  });

  it('falls back to the raw source (no throw) for an unknown/new backend source', () => {
    // Guards against the FE label map drifting behind the backend enum again.
    const unknown = 'future_source' as unknown as StayCredit['source'];
    expect(() => stayCreditSourceText(unknown, true)).not.toThrow();
    expect(stayCreditSourceText(unknown, true)).toBe('future_source');
  });

  it('prefers the benefit registry copy when the payload is provided (SMA-322)', () => {
    expect(stayCreditSourceText('payment_points', true, BENEFITS_PAYLOAD)).toBe(
      'Earn stay credit on every completed, reviewed trip.',
    );
    expect(stayCreditSourceText('payment_points', false, BENEFITS_PAYLOAD)).toBe(
      '여행 후기를 남기면 등급별로 크레딧이 적립됩니다.',
    );
    expect(stayCreditSourceText('signup', true, BENEFITS_PAYLOAD)).toBe(
      'A welcome credit when you join Travel in Your Pocket.',
    );
  });

  it('degrades to the static fallback label when the payload lacks the entry', () => {
    // birthday_credit is not in the fixture payload — the static label wins.
    expect(stayCreditSourceText('birthday', true, BENEFITS_PAYLOAD)).toBe('Birthday');
    // null payload (endpoint unavailable) behaves like the no-payload call.
    expect(stayCreditSourceText('payment_points', true, null)).toBe('Trip cashback');
  });

  it('never crashes on an unknown source even with a payload present', () => {
    const unknown = 'future_source' as unknown as StayCredit['source'];
    expect(stayCreditSourceText(unknown, true, BENEFITS_PAYLOAD)).toBe('future_source');
  });
});

describe('STAY_CREDIT_SOURCE_BENEFIT_KEYS', () => {
  it('maps every credit source to a registry entry key', () => {
    expect(Object.keys(STAY_CREDIT_SOURCE_BENEFIT_KEYS).sort()).toEqual(
      Object.keys(STAY_CREDIT_SOURCE_LABELS).sort(),
    );
    for (const [source, key] of Object.entries(STAY_CREDIT_SOURCE_BENEFIT_KEYS)) {
      expect(key, `missing benefit key for ${source}`).toBeTruthy();
    }
  });

  it('creditSourceLabel keeps the promo-code suffix on top of registry copy', () => {
    const payload: BenefitsResponse = {
      benefits: [
        {
          key: 'promo_code_redemption',
          kind: 'one_off_grant',
          unit: null,
          values_by_tier: null,
          copy: { en: 'Redeemed promo code.', kr: '프로모션 코드 등록.' },
        },
      ],
      resolved: null,
    };
    const credit = makeCredit({ source: 'promo_code_redemption', promo_code: 'WELCOME26' });
    expect(creditSourceLabel(credit, true, payload)).toBe('Redeemed promo code. · WELCOME26');
  });
});

describe('STAY_CREDIT_SOURCE_LABELS', () => {
  it('carries no hardcoded money/rate figures (SMA-321/SMA-322)', () => {
    // The earn rate is tiered per membership, so any literal percentage in
    // a fallback label is wrong for most members. Figures come from the
    // benefits payload only.
    for (const [source, entry] of Object.entries(STAY_CREDIT_SOURCE_LABELS)) {
      expect(entry.en, `EN label for ${source} contains a figure`).not.toMatch(/[%$₩]\s?\d|\d\s?%/);
      expect(entry.kr, `KR label for ${source} contains a figure`).not.toMatch(/[%$₩]\s?\d|\d\s?%/);
    }
    expect(STAY_CREDIT_SOURCE_LABELS.payment_points.en).toBe('Trip cashback');
    expect(STAY_CREDIT_SOURCE_LABELS.first_trip_cashback.en).toBe('First-trip bonus');
    expect(STAY_CREDIT_SOURCE_LABELS.payment_points.kr).toBe('결제 적립');
    expect(STAY_CREDIT_SOURCE_LABELS.first_trip_cashback.kr).toBe('첫 여행 보너스');
  });

  it('covers every member of the backend StayCreditSource enum (drift guard)', () => {
    // Mirrored from tip-backend/v2/data_model/enums.py::StayCreditSource.
    // If the backend adds an enum member, add it here AND to the union +
    // label map in src/types/stay-credit.ts (this is exactly the drift that
    // crashed the travel-history detail page on `signup` credits — SMA-320).
    const backendEnumMembers = [
      'welcome',
      'birthday',
      'referral',
      'manual',
      'payment_points',
      'first_trip_cashback',
      'review_reward',
      'gift',
      'promo_code_redemption',
      'kb_welcome',
      'kb_premium_booking',
      'signup',
    ];
    expect(Object.keys(STAY_CREDIT_SOURCE_LABELS).sort()).toEqual([...backendEnumMembers].sort());
  });

  it('has non-empty EN and KR copy for every source', () => {
    for (const [source, entry] of Object.entries(STAY_CREDIT_SOURCE_LABELS)) {
      expect(entry.en, `missing EN label for ${source}`).toBeTruthy();
      expect(entry.kr, `missing KR label for ${source}`).toBeTruthy();
    }
  });
});
