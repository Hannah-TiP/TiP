import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * SMA-322 anti-regression guard (structurally closes SMA-321): benefit
 * money/percentage figures must render from the GET /api/v2/benefits
 * registry payload, never from hardcoded literals — the earn rate is
 * tiered per membership, so any literal "2%" was wrong for most members.
 *
 * The scan is a SCOPED path list (not repo-wide): the credit label module
 * and the membership/credit page sources. The sanctioned home for the
 * static fallback figures is src/lib/benefits-fallback.ts, which is
 * deliberately NOT scanned.
 */

const SRC_ROOT = path.resolve(__dirname, '../..');

const GUARDED_FILES = [
  'types/stay-credit.ts',
  'app/my-page/membership/page.tsx',
  'app/my-page/credits/page.tsx',
  'app/my-page/travel-history/[id]/page.tsx',
  // SMA-358: referral / welcome / pending-earn / promo-code surfaces.
  'app/my-page/referrals/page.tsx',
  'app/register/page.tsx',
  'app/onboarding/page.tsx',
  'components/WelcomeOfferPopup.tsx',
  'components/credits/PendingEarningsSection.tsx',
  'components/credits/RedeemCodeSection.tsx',
];

// Translation keys (by prefix) whose EN + KR values must carry NO benefit
// figure — the point/credit amounts are substituted from the registry via
// {points}-style placeholders (SMA-358).
const GUARDED_TRANSLATION_KEY_PREFIXES = [
  'register.invited_by',
  'onboarding.invited_body',
  'referrals.',
  'welcome_offer.',
  'credits.pending_',
  'credits.redeem_success',
  'trip_detail.pending_points_',
  'membership.member_earn_rate',
];

// A digit immediately (or one space) before a percent sign — "2%", "0.1 %"
// (the exact SMA-321 regression shape) — OR a currency/percent sign
// immediately (or one space) before a digit — "$100", "₩9,500,000", "% 3" —
// OR (SMA-358) a "USD 100" / "5,000 P" literal, the credit→points era shapes.
const BENEFIT_FIGURE = /\d\s?%|[%$₩]\s?\d|\bUSD\s?\d|\d\s?P\b/;

describe('no hardcoded benefit figures (SMA-322)', () => {
  it('the regex catches the SMA-321 regression shapes (self-check)', () => {
    // Percent-SUFFIX literals are the original regression — a sign-first
    // pattern alone lets them through.
    expect(BENEFIT_FIGURE.test('Trip cashback — 2%')).toBe(true);
    expect(BENEFIT_FIGURE.test('First-trip bonus — 3%')).toBe(true);
    expect(BENEFIT_FIGURE.test('결제 적립 — 2%')).toBe(true);
    expect(BENEFIT_FIGURE.test('$100 hotel credit')).toBe(true);
    expect(BENEFIT_FIGURE.test('연 ₩9,500,000')).toBe(true);
    // SMA-358 shapes: currency-denominated and point literals.
    expect(BENEFIT_FIGURE.test('Claim Your USD 100 Credit →')).toBe(true);
    expect(BENEFIT_FIGURE.test('receives 5,000 P when they join')).toBe(true);
    expect(BENEFIT_FIGURE.test('30,000 P의 TiP 포인트')).toBe(true);
    // Figure-free copy must not match.
    expect(BENEFIT_FIGURE.test('Trip cashback')).toBe(false);
    expect(BENEFIT_FIGURE.test('Stay Credit — {carteCredit} per stay')).toBe(false);
    expect(BENEFIT_FIGURE.test('{points} added to your TiP Points.')).toBe(false);
    expect(BENEFIT_FIGURE.test('≈ USD {amount}')).toBe(false);
  });

  it('finds every guarded source file', () => {
    // Sanity check so a moved/renamed file can never silently pass.
    for (const file of GUARDED_FILES) {
      expect(fs.existsSync(path.join(SRC_ROOT, file)), `missing guarded file: ${file}`).toBe(true);
    }
  });

  it.each(GUARDED_FILES)('%s contains no currency/percentage literals', (file) => {
    const source = fs.readFileSync(path.join(SRC_ROOT, file), 'utf8');
    const offendingLines = source
      .split('\n')
      .map((line, index) => ({ line, number: index + 1 }))
      .filter(({ line }) => BENEFIT_FIGURE.test(line));
    expect(
      offendingLines.map(({ number, line }) => `${number}: ${line.trim()}`),
      'Benefit figures must come from the benefits payload (src/lib/benefits.ts) ' +
        'or the sanctioned fallbacks in src/lib/benefits-fallback.ts — never literals here.',
    ).toEqual([]);
  });

  it.each(['en', 'kr'])('translations/%s.json guarded keys contain no benefit figures', (lang) => {
    const catalog = JSON.parse(
      fs.readFileSync(path.join(SRC_ROOT, 'translations', `${lang}.json`), 'utf8'),
    ) as Record<string, string>;
    const guardedKeys = Object.keys(catalog).filter((key) =>
      GUARDED_TRANSLATION_KEY_PREFIXES.some((prefix) => key.startsWith(prefix)),
    );
    // Sanity: every prefix must still match at least one key, so a rename
    // can never silently empty the guard.
    for (const prefix of GUARDED_TRANSLATION_KEY_PREFIXES) {
      expect(
        guardedKeys.some((key) => key.startsWith(prefix)),
        `no ${lang} keys under guarded prefix: ${prefix}`,
      ).toBe(true);
    }
    const offending = guardedKeys
      .filter((key) => BENEFIT_FIGURE.test(catalog[key]))
      .map((key) => `${key}: ${catalog[key]}`);
    expect(
      offending,
      'Benefit/point figures in copy must be {placeholder}-substituted from the registry, never literals.',
    ).toEqual([]);
  });
});
