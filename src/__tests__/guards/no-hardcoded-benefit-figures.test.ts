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

// A currency/percent sign immediately (or one space) before a digit —
// e.g. "$100", "₩9,500,000", "% 3". ("0.1%"-style suffixes don't match;
// the ban is on authored money figures.)
const BENEFIT_FIGURE = /[%$₩]\s?\d/;

describe('no hardcoded benefit figures (SMA-322)', () => {
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
