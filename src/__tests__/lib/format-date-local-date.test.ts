import { afterAll, describe, expect, it, vi } from 'vitest';

// SMA-626: trip `start_date` / `end_date` are calendar-date strings
// (`YYYY-MM-DD`). `new Date('2026-10-20')` parses as UTC midnight, which is
// the 19th anywhere west of UTC. Pin the timezone BEFORE the module under test
// is imported (vi.hoisted runs ahead of the hoisted imports; Node honours
// runtime TZ changes, so later reassignments in this file take effect too).
const ORIGINAL_TZ = vi.hoisted(() => {
  const original = process.env.TZ;
  process.env.TZ = 'America/Los_Angeles';
  return original;
});

import { formatDate, formatDateRange, formatDateTime, parseLocalDate } from '@/lib/format-date';

afterAll(() => {
  if (ORIGINAL_TZ === undefined) delete process.env.TZ;
  else process.env.TZ = ORIGINAL_TZ;
});

const DATE_ONLY = '2026-10-20';
const OPTS: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };

describe.each([
  ['America/Los_Angeles', 19],
  ['America/Sao_Paulo', 19],
  ['Pacific/Honolulu', 19],
  ['Asia/Seoul', 20],
])('date-only trip dates under TZ=%s', (tz, naiveDay) => {
  it('is actually running in that timezone (sanity: naive parse gives the expected day)', () => {
    process.env.TZ = tz;
    expect(new Date(DATE_ONLY).getDate()).toBe(naiveDay);
  });

  it('parseLocalDate yields local midnight on the 20th', () => {
    process.env.TZ = tz;
    const d = parseLocalDate(DATE_ONLY);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(9);
    expect(d.getDate()).toBe(20);
    expect(d.getHours()).toBe(0);
  });

  it('formatDate renders the 20th for both en and kr', () => {
    process.env.TZ = tz;
    const expected = new Date(2026, 9, 20);
    expect(formatDate(DATE_ONLY, 'en', OPTS)).toBe(expected.toLocaleDateString('en-US', OPTS));
    expect(formatDate(DATE_ONLY, 'en', OPTS)).toContain('20');
    expect(formatDate(DATE_ONLY, 'kr', OPTS)).toBe(expected.toLocaleDateString('ko-KR', OPTS));
    expect(formatDate(DATE_ONLY, 'kr', OPTS)).toContain('20일');
  });

  it('formatDateRange renders both ends on their calendar days', () => {
    process.env.TZ = tz;
    const out = formatDateRange(DATE_ONLY, '2026-10-25', 'en', OPTS);
    const s = new Date(2026, 9, 20).toLocaleDateString('en-US', OPTS);
    const e = new Date(2026, 9, 25).toLocaleDateString('en-US', OPTS);
    expect(out).toBe(`${s} – ${e}`);
  });

  it('formatDateTime treats a date-only string as local midnight', () => {
    process.env.TZ = tz;
    const opts: Intl.DateTimeFormatOptions = { ...OPTS, hour: 'numeric' };
    expect(formatDateTime(DATE_ONLY, 'en', opts)).toBe(
      new Date(2026, 9, 20).toLocaleString('en-US', opts),
    );
  });
});

describe('non-date-only inputs keep the `new Date` path', () => {
  it('a full ISO datetime with an offset is parsed as a timestamp', () => {
    process.env.TZ = 'America/Los_Angeles';
    const iso = '2026-10-20T03:00:00Z'; // Oct 19 20:00 PDT — correct to show the 19th
    expect(formatDate(iso, 'en', OPTS)).toBe(new Date(iso).toLocaleDateString('en-US', OPTS));
    expect(formatDate(iso, 'en', OPTS)).toContain('19');
    expect(formatDateRange(iso, iso, 'kr', OPTS)).toBe(
      `${new Date(iso).toLocaleDateString('ko-KR', OPTS)} – ${new Date(iso).toLocaleDateString('ko-KR', OPTS)}`,
    );
  });

  it('epoch numbers and Date objects pass through unchanged', () => {
    const d = new Date(2026, 9, 20, 15, 45);
    expect(formatDate(d.getTime(), 'en', OPTS)).toBe(d.toLocaleDateString('en-US', OPTS));
    expect(formatDate(d, 'kr', OPTS)).toBe(d.toLocaleDateString('ko-KR', OPTS));
  });

  it('does not treat near-miss strings as date-only', () => {
    // No zero padding / trailing chars → not a calendar-date string → `new Date`.
    expect(parseLocalDate('2026-1-5').getTime()).toBeNaN();
    expect(parseLocalDate('2026-10-20 ').getTime()).toBeNaN();
    expect(parseLocalDate('2026-10-20T00:00').getTime()).toBeNaN();
  });
});

describe('malformed input', () => {
  it('parseLocalDate returns an Invalid Date for garbage and rolled-over dates', () => {
    expect(parseLocalDate('not-a-date').getTime()).toBeNaN();
    expect(parseLocalDate('2026-13-01').getTime()).toBeNaN();
    expect(parseLocalDate('2026-02-30').getTime()).toBeNaN();
    expect(parseLocalDate('2026-00-10').getTime()).toBeNaN();
  });

  it('formatDate still returns the raw string and formatDateRange still returns null', () => {
    expect(formatDate('not-a-date', 'en')).toBe('not-a-date');
    expect(formatDate('2026-02-30', 'kr')).toBe('2026-02-30');
    expect(formatDateRange('2026-02-30', DATE_ONLY, 'en')).toBeNull();
  });
});
