import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatTime,
  formatDateTime,
  formatDateRange,
  localeForLang,
} from '@/lib/format-date';

// A fixed local date/time used across assertions. We build it with the local
// constructor so the rendered calendar day/time matches regardless of the
// machine timezone.
const SAMPLE = new Date(2026, 5, 15, 9, 30); // 2026-06-15 09:30 local

describe('localeForLang', () => {
  it('maps en → en-US and kr → ko-KR', () => {
    expect(localeForLang('en')).toBe('en-US');
    expect(localeForLang('kr')).toBe('ko-KR');
  });
});

describe('formatDate', () => {
  it('renders the en-US locale for en (short month + comma, no Korean markers)', () => {
    const out = formatDate(SAMPLE, 'en', { year: 'numeric', month: 'short', day: 'numeric' });
    // en-US short-month formatting uses a comma and contains no Korean markers.
    expect(out).toBe(
      new Date(2026, 5, 15).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
    );
    expect(out).toContain(',');
    expect(out).not.toContain('년');
  });

  it('renders the ko-KR locale for kr (Korean year/month/day markers)', () => {
    const out = formatDate(SAMPLE, 'kr', { year: 'numeric', month: 'long', day: 'numeric' });
    expect(out).toBe(
      new Date(2026, 5, 15).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    );
    expect(out).toContain('년');
    expect(out).toContain('월');
    expect(out).toContain('일');
  });

  it('returns the raw string for an unparseable date string', () => {
    expect(formatDate('not-a-date', 'en')).toBe('not-a-date');
    expect(formatDate('not-a-date', 'kr')).toBe('not-a-date');
  });
});

describe('formatTime', () => {
  it('uses en-US time formatting for en', () => {
    const out = formatTime(SAMPLE, 'en', { hour: 'numeric', minute: '2-digit' });
    expect(out).toBe(SAMPLE.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }));
  });

  it('uses ko-KR time formatting for kr', () => {
    const out = formatTime(SAMPLE, 'kr', { hour: 'numeric', minute: '2-digit' });
    expect(out).toBe(SAMPLE.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' }));
  });
});

describe('formatDateTime', () => {
  it('maps the locale through toLocaleString for both languages', () => {
    const opts: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    };
    expect(formatDateTime(SAMPLE, 'en', opts)).toBe(SAMPLE.toLocaleString('en-US', opts));
    expect(formatDateTime(SAMPLE, 'kr', opts)).toBe(SAMPLE.toLocaleString('ko-KR', opts));
  });
});

describe('formatDateRange', () => {
  const start = new Date(2026, 5, 15);
  const end = new Date(2026, 5, 20);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const endOpts: Intl.DateTimeFormatOptions = { ...opts, year: 'numeric' };

  it('joins both ends with the en-US locale and applies endOpts to the end', () => {
    const out = formatDateRange(start, end, 'en', opts, endOpts);
    expect(out).toBe(
      `${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', endOpts)}`,
    );
  });

  it('joins both ends with the ko-KR locale for kr', () => {
    const out = formatDateRange(start, end, 'kr', opts, endOpts);
    expect(out).toBe(
      `${start.toLocaleDateString('ko-KR', opts)} – ${end.toLocaleDateString('ko-KR', endOpts)}`,
    );
    expect(out).toContain('월');
  });

  it('returns null when either end is missing/invalid', () => {
    expect(formatDateRange('bad', end, 'en')).toBeNull();
    expect(formatDateRange(start, 'bad', 'kr')).toBeNull();
  });
});
