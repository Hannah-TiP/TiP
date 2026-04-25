import { describe, it, expect } from 'vitest';
import { formatDateLabel } from '@/lib/trip-display';

describe('formatDateLabel', () => {
  it('renders the literal calendar date (no UTC drift in western timezones)', () => {
    // The bug: `new Date('2026-05-02')` is parsed as UTC midnight and renders as
    // "Fri, May 1" in PST. The fix parses YYYY-MM-DD as a local date so the displayed
    // calendar day always matches the input string.
    expect(formatDateLabel('2026-05-02')).toBe('Sat, May 2');
    expect(formatDateLabel('2026-05-04')).toBe('Mon, May 4');
    expect(formatDateLabel('2026-01-01')).toBe('Thu, Jan 1');
  });

  it('falls back to the raw string for malformed input', () => {
    expect(formatDateLabel('not-a-date')).toBe('not-a-date');
    expect(formatDateLabel('2026-05')).toBe('2026-05');
  });
});
