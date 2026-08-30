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
];

// A digit immediately (or one space) before a percent sign — "2%", "0.1 %"
// (the exact SMA-321 regression shape) — OR a currency/percent sign
// immediately (or one space) before a digit — "$100", "₩9,500,000", "% 3".
const BENEFIT_FIGURE = /\d\s?%|[%$₩]\s?\d/;

describe('no hardcoded benefit figures (SMA-322)', () => {
  it('the regex catches the SMA-321 regression shapes (self-check)', () => {
    // Percent-SUFFIX literals are the original regression — a sign-first
    // pattern alone lets them through.
    expect(BENEFIT_FIGURE.test('Trip cashback — 2%')).toBe(true);
    expect(BENEFIT_FIGURE.test('First-trip bonus — 3%')).toBe(true);
    expect(BENEFIT_FIGURE.test('결제 적립 — 2%')).toBe(true);
    expect(BENEFIT_FIGURE.test('$100 hotel credit')).toBe(true);
    expect(BENEFIT_FIGURE.test('연 ₩9,500,000')).toBe(true);
    // Figure-free copy must not match.
    expect(BENEFIT_FIGURE.test('Trip cashback')).toBe(false);
    expect(BENEFIT_FIGURE.test('Stay Credit — {carteCredit} per stay')).toBe(false);
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
});
