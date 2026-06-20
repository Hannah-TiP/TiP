import { describe, it, expect } from 'vitest';
import { formatDateLabel, formatTime, getItemLabel, ITEM_LABEL_KEYS } from '@/lib/trip-display';
import en from '@/translations/en.json';
import kr from '@/translations/kr.json';
import type { TranslationKeys } from '@/contexts/LanguageContext';

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

describe('getItemLabel', () => {
  const tEn = (key: TranslationKeys): string => en[key] ?? kr[key] ?? key;
  const tKr = (key: TranslationKeys): string => kr[key] ?? en[key] ?? key;

  it('resolves the localized label for each item type in EN', () => {
    expect(getItemLabel('flight', tEn)).toBe('Flight');
    expect(getItemLabel('hotel', tEn)).toBe('Hotel');
    expect(getItemLabel('restaurant', tEn)).toBe('Restaurant');
    expect(getItemLabel('activity', tEn)).toBe('Activity');
    expect(getItemLabel('transfer', tEn)).toBe('Transfer');
    expect(getItemLabel('note', tEn)).toBe('Note');
  });

  it('resolves the localized label for each item type in KR', () => {
    expect(getItemLabel('flight', tKr)).toBe('항공');
    expect(getItemLabel('hotel', tKr)).toBe('호텔');
    expect(getItemLabel('restaurant', tKr)).toBe('레스토랑');
    expect(getItemLabel('activity', tKr)).toBe('액티비티');
    expect(getItemLabel('transfer', tKr)).toBe('이동');
    expect(getItemLabel('note', tKr)).toBe('메모');
  });

  it('maps every item type to a key present in both catalogs', () => {
    for (const key of Object.values(ITEM_LABEL_KEYS)) {
      expect(en[key]).toBeTruthy();
      expect(kr[key]).toBeTruthy();
    }
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
