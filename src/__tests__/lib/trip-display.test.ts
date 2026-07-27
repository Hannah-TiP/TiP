import { afterEach, describe, it, expect, vi } from 'vitest';
import {
  formatDateLabel,
  formatTime,
  getItemLabel,
  getStatusLabel,
  ITEM_LABEL_KEYS,
  JOURNEY_STEP_ORDER,
  resolveJourneyStep,
  STATUS_TO_JOURNEY_INDEX,
  STATUS_TO_STEP_KEY,
} from '@/lib/trip-display';
import en from '@/translations/en.json';
import kr from '@/translations/kr.json';
import type { TranslationKeys } from '@/contexts/LanguageContext';
import type { TripStatus } from '@/types/trip';

/**
 * Runtime list of every TripStatus. The `satisfies Record<TripStatus, true>`
 * clause makes this test file fail to COMPILE when a new status is added to
 * the union without extending this list (and, via STATUS_TO_JOURNEY_INDEX's
 * own `satisfies`, without defining its stepper state).
 */
const ALL_TRIP_STATUSES = Object.keys({
  draft: true,
  'waiting-for-proposal': true,
  'in-progress': true,
  'waiting-for-payment': true,
  paid: true,
  'ready-to-travel': true,
  'traveling-now': true,
  'travel-completed': true,
  canceled: true,
} satisfies Record<TripStatus, true>) as TripStatus[];

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

describe('getStatusLabel', () => {
  const tEn = (key: TranslationKeys): string => en[key] ?? kr[key] ?? key;
  const tKr = (key: TranslationKeys): string => kr[key] ?? en[key] ?? key;

  it('resolves the canonical (shorter step_*) label for each status in EN', () => {
    expect(getStatusLabel('draft', tEn)).toBe('Planning');
    expect(getStatusLabel('waiting-for-proposal', tEn)).toBe('Submitted');
    expect(getStatusLabel('in-progress', tEn)).toBe('Proposal');
    expect(getStatusLabel('waiting-for-payment', tEn)).toBe('Payment');
    expect(getStatusLabel('paid', tEn)).toBe('Paid');
    expect(getStatusLabel('ready-for-travel', tEn)).toBe('Ready');
    expect(getStatusLabel('ready-to-travel', tEn)).toBe('Ready');
    expect(getStatusLabel('traveling-now', tEn)).toBe('Traveling');
    expect(getStatusLabel('travel-completed', tEn)).toBe('Completed');
    expect(getStatusLabel('canceled', tEn)).toBe('Canceled');
  });

  it('resolves the Korean label for each status in KR', () => {
    expect(getStatusLabel('draft', tKr)).toBe('계획');
    expect(getStatusLabel('waiting-for-proposal', tKr)).toBe('제출됨');
    expect(getStatusLabel('in-progress', tKr)).toBe('제안');
    expect(getStatusLabel('waiting-for-payment', tKr)).toBe('결제');
    expect(getStatusLabel('paid', tKr)).toBe('결제 완료');
    expect(getStatusLabel('ready-for-travel', tKr)).toBe('준비 완료');
    expect(getStatusLabel('ready-to-travel', tKr)).toBe('준비 완료');
    expect(getStatusLabel('traveling-now', tKr)).toBe('여행 중');
    expect(getStatusLabel('travel-completed', tKr)).toBe('완료');
    expect(getStatusLabel('canceled', tKr)).toBe('취소됨');
  });

  it('Title-Cases an unknown/unmapped status as a safe fallback', () => {
    expect(getStatusLabel('some-unknown-status', tEn)).toBe('Some Unknown Status');
    expect(getStatusLabel('some-unknown-status', tKr)).toBe('Some Unknown Status');
    expect(getStatusLabel('weird', tEn)).toBe('Weird');
  });

  it('maps every status to a key present in both catalogs', () => {
    for (const key of Object.values(STATUS_TO_STEP_KEY)) {
      expect(en[key]).toBeTruthy();
      expect(kr[key]).toBeTruthy();
    }
  });

  it('no longer carries the phantom waiting_for_booking_docs key', () => {
    expect('waiting_for_booking_docs' in STATUS_TO_STEP_KEY).toBe(false);
  });
});

describe('JOURNEY_STEP_ORDER', () => {
  it('defines the 8-step track with the dedicated paid step between payment and ready', () => {
    expect(JOURNEY_STEP_ORDER.map((s) => s.key)).toEqual([
      'draft',
      'waiting-for-proposal',
      'in-progress',
      'waiting-for-payment',
      'paid',
      'ready-to-travel',
      'traveling-now',
      'travel-completed',
    ]);
    expect(JOURNEY_STEP_ORDER[4]).toEqual({ key: 'paid', labelKey: 'trip.step_paid' });
  });

  it('has every step label key in both catalogs (EN + KR)', () => {
    for (const step of JOURNEY_STEP_ORDER) {
      expect(en[step.labelKey]).toBeTruthy();
      expect(kr[step.labelKey]).toBeTruthy();
    }
    expect(en['trip.step_paid']).toBe('Paid');
    expect(kr['trip.step_paid']).toBe('결제 완료');
  });
});

describe('resolveJourneyStep', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('maps EVERY TripStatus to a defined stepper state without warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    for (const status of ALL_TRIP_STATUSES) {
      const { currentIndex } = resolveJourneyStep(status);
      if (status === 'canceled') {
        // Defined state for canceled: NO active step (all circles empty) —
        // deliberate preservation of current behavior (SMA-238 scope decision).
        expect(currentIndex).toBeNull();
      } else {
        expect(currentIndex).not.toBeNull();
        expect(currentIndex).toBeGreaterThanOrEqual(0);
        expect(currentIndex).toBeLessThan(JOURNEY_STEP_ORDER.length);
        // The resolved step is the status's own circle.
        expect(JOURNEY_STEP_ORDER[currentIndex!].key).toBe(status);
      }
    }
    expect(warn).not.toHaveBeenCalled();
    // The index map itself is satisfies-checked against the union.
    expect(Object.keys(STATUS_TO_JOURNEY_INDEX).sort()).toEqual([...ALL_TRIP_STATUSES].sort());
  });

  it('marks paid as the current step with payment before it', () => {
    expect(resolveJourneyStep('paid').currentIndex).toBe(4);
    expect(resolveJourneyStep('waiting-for-payment').currentIndex).toBe(3);
  });

  it('normalizes the legacy ready-for-travel spelling to ready-to-travel', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(resolveJourneyStep('ready-for-travel').currentIndex).toBe(5);
    expect(resolveJourneyStep('ready-to-travel').currentIndex).toBe(5);
    expect(warn).not.toHaveBeenCalled();
  });

  it('warns and falls back to the first step for an unknown status', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(resolveJourneyStep('waiting_for_booking_docs').currentIndex).toBe(0);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('waiting_for_booking_docs');
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
