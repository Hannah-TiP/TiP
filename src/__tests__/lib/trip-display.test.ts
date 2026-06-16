import { describe, it, expect } from 'vitest';
import { formatDateLabel, formatTime } from '@/lib/trip-display';

describe('formatDateLabel', () => {
  it('renders the literal calendar date in EN (no UTC drift in western timezones)', () => {
    // The bug: `new Date('2026-05-02')` is parsed as UTC midnight and renders as
    // "Fri, May 1" in PST. The fix parses YYYY-MM-DD as a local date so the displayed
    // calendar day always matches the input string.
    expect(formatDateLabel('2026-05-02', 'en')).toBe('Sat, May 2');
    expect(formatDateLabel('2026-05-04', 'en')).toBe('Mon, May 4');
    expect(formatDateLabel('2026-01-01', 'en')).toBe('Thu, Jan 1');
  });

  it('renders the date in the Korean locale for KR', () => {
    const out = formatDateLabel('2026-05-02', 'kr');
    expect(out).toBe(
      new Date(2026, 4, 2).toLocaleDateString('ko-KR', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
    );
    expect(out).toContain('월');
  });

  it('falls back to the raw string for malformed input', () => {
    expect(formatDateLabel('not-a-date', 'en')).toBe('not-a-date');
    expect(formatDateLabel('2026-05', 'kr')).toBe('2026-05');
  });
});

describe('formatTime', () => {
  it('returns undefined for empty input', () => {
    expect(formatTime(null, 'en')).toBeUndefined();
    expect(formatTime(undefined, 'kr')).toBeUndefined();
  });

  it('formats an ISO datetime in the requested locale', () => {
    const iso = '2026-05-02T09:30:00';
    expect(formatTime(iso, 'en')).toBe(
      new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    );
    expect(formatTime(iso, 'kr')).toBe(
      new Date(iso).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' }),
    );
  });
});
