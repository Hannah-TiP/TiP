import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  filterBenefitsByDates,
  formatBenefitEligibility,
  localizeBenefitStrings,
} from '@/lib/hotel-benefits';
import type { HotelBenefitProgram } from '@/types/hotel';

const program = (
  name: string,
  valid_from: string | null,
  valid_until: string | null,
): HotelBenefitProgram => ({
  program_name: name,
  valid_from,
  valid_until,
  benefits: [{ en: `${name} benefit`, kr: `${name} 혜택` }],
});

const BULGARI = program('Summer', '2026-05-01', '2026-09-30');
const ALWAYS = program('Always', null, null);
const FROM_ONLY = program('FromOnly', '2026-08-01', null);

// EN templates mirroring the backend wording (en.json keys).
const EN_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const enTemplates = {
  range: 'valid {from}–{until}',
  from: 'valid from {from}',
  until: 'valid until {until}',
  month: (m: number) => EN_MONTHS[m - 1],
};

describe('filterBenefitsByDates', () => {
  it('July stay includes the Bulgari summer program and the always-valid one', () => {
    const result = filterBenefitsByDates([BULGARI, ALWAYS], '2026-07-10', '2026-07-15');
    expect(result.map((p) => p.program_name)).toEqual(['Summer', 'Always']);
  });

  it('November stay hides the date-bounded Bulgari program', () => {
    const result = filterBenefitsByDates([BULGARI, ALWAYS], '2026-11-10', '2026-11-15');
    expect(result.map((p) => p.program_name)).toEqual(['Always']);
  });

  it('no trip dates returns all programs unfiltered', () => {
    const result = filterBenefitsByDates([BULGARI, ALWAYS], '', '');
    expect(result.map((p) => p.program_name)).toEqual(['Summer', 'Always']);
  });

  it('only one date set is treated as no dates (no filtering)', () => {
    const result = filterBenefitsByDates([BULGARI], '2026-11-10', null);
    expect(result.map((p) => p.program_name)).toEqual(['Summer']);
  });

  it('valid_from-only program overlaps only on/after its start', () => {
    expect(filterBenefitsByDates([FROM_ONLY], '2026-09-01', '2026-09-05')).toHaveLength(1);
    expect(filterBenefitsByDates([FROM_ONLY], '2026-06-01', '2026-06-05')).toHaveLength(0);
  });

  it('malformed program dates fail open (benefit retained)', () => {
    const bad = program('Bad', 'not-a-date', 'also-bad');
    const result = filterBenefitsByDates([bad], '2026-11-10', '2026-11-15');
    expect(result.map((p) => p.program_name)).toEqual(['Bad']);
  });
});

describe('localizeBenefitStrings', () => {
  it('flattens all programs into localized strings (EN)', () => {
    const multi: HotelBenefitProgram = {
      program_name: 'Multi',
      valid_from: null,
      valid_until: null,
      benefits: [
        { en: 'Daily breakfast', kr: '매일 조식' },
        { en: 'Room upgrade', kr: '객실 업그레이드' },
      ],
    };
    expect(localizeBenefitStrings([multi, ALWAYS], 'en')).toEqual([
      'Daily breakfast',
      'Room upgrade',
      'Always benefit',
    ]);
  });

  it('localizes to Korean when lang is kr', () => {
    expect(localizeBenefitStrings([ALWAYS], 'kr')).toEqual(['Always 혜택']);
  });

  it('does not date-filter date-bounded programs', () => {
    // BULGARI is bounded to May–Sep but still surfaces — no dates context.
    expect(localizeBenefitStrings([BULGARI], 'en')).toEqual(['Summer benefit']);
  });

  it('returns [] for null/undefined/empty programs', () => {
    expect(localizeBenefitStrings(null)).toEqual([]);
    expect(localizeBenefitStrings(undefined)).toEqual([]);
    expect(localizeBenefitStrings([])).toEqual([]);
  });

  it('drops empty localized strings', () => {
    const blank: HotelBenefitProgram = {
      program_name: 'Blank',
      valid_from: null,
      valid_until: null,
      benefits: [
        { en: '', kr: '' },
        { en: 'Kept', kr: '유지' },
      ],
    };
    expect(localizeBenefitStrings([blank], 'en')).toEqual(['Kept']);
  });
});

describe('formatBenefitEligibility', () => {
  beforeEach(() => {
    // Pin "now" to 2026 so the current-year suffix rules are deterministic.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-07T00:00:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('full range in current year shows no year suffix', () => {
    expect(formatBenefitEligibility('2026-05-01', '2026-09-30', enTemplates)).toBe('valid May–Sep');
  });

  it('from-only shows the day', () => {
    expect(formatBenefitEligibility('2026-05-01', null, enTemplates)).toBe('valid from May 1');
  });

  it('until-only shows the day', () => {
    expect(formatBenefitEligibility(null, '2026-09-30', enTemplates)).toBe('valid until Sep 30');
  });

  it('both null returns null', () => {
    expect(formatBenefitEligibility(null, null, enTemplates)).toBeNull();
  });

  it('malformed returns null', () => {
    expect(formatBenefitEligibility('xx', 'yy', enTemplates)).toBeNull();
  });

  it('range crossing a year boundary includes both years', () => {
    expect(formatBenefitEligibility('2026-11-01', '2027-02-28', enTemplates)).toBe(
      'valid Nov 2026–Feb 2027',
    );
  });

  it('range entirely in a non-current year includes the year', () => {
    expect(formatBenefitEligibility('2027-05-01', '2027-09-30', enTemplates)).toBe(
      'valid May–Sep 2027',
    );
  });
});
