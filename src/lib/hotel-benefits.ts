/**
 * Hotel-benefit date filtering + eligibility labelling (SMA-41).
 *
 * Mirrors the backend service-layer helpers in
 * `tip-backend/v2/services/ai_chat.py` (`_filter_benefit_programs_by_dates` /
 * `_format_benefit_eligibility`) so the AI hotel carousel (filtered + labelled
 * server-side) and the hotel detail page BookingCard (filtered + labelled here)
 * read identically.
 *
 * Date-bounded benefits are gated by overlap with the user's stay window. When
 * the user has not picked dates, all benefits are shown and each date-bounded
 * one gets an inline eligibility label (e.g. "Free breakfast (valid May–Sep)").
 */

import type { HotelBenefitProgram } from '@/types/hotel';
import { getLocalizedText } from '@/types/common';

/**
 * Flatten benefit programs into localized display strings — no date filtering
 * and no eligibility labels. For compact-teaser contexts (e.g. the dream-hotels
 * map popup) where no stay dates exist; the full date-aware rendering lives on
 * the hotel detail page. Empty/missing programs yield [] — callers decide
 * their own fallback.
 */
export function localizeBenefitStrings(
  programs: HotelBenefitProgram[] | null | undefined,
  lang: 'en' | 'kr' = 'en',
): string[] {
  return (programs ?? []).flatMap((program) =>
    program.benefits.map((benefit) => getLocalizedText(benefit, lang)).filter(Boolean),
  );
}

/** Parse an ISO date string to a UTC `Date`, or null on null/malformed (fail open). */
function parseIsoDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) {
    return null;
  }
  return d;
}

function programOverlaps(program: HotelBenefitProgram, tripStart: Date, tripEnd: Date): boolean {
  const programStart = parseIsoDate(program.valid_from);
  const programEnd = parseIsoDate(program.valid_until);
  if (programStart !== null && programStart.getTime() > tripEnd.getTime()) return false;
  if (programEnd !== null && programEnd.getTime() < tripStart.getTime()) return false;
  return true;
}

/**
 * Return only programs whose validity range overlaps the trip window.
 *
 * Null trip dates (either bound) ⇒ no filtering (return all). Programs with
 * null/malformed bounds are treated as open on that side.
 */
export function filterBenefitsByDates(
  programs: HotelBenefitProgram[],
  checkIn: string | null | undefined,
  checkOut: string | null | undefined,
): HotelBenefitProgram[] {
  const tripStart = parseIsoDate(checkIn);
  const tripEnd = parseIsoDate(checkOut);
  if (tripStart === null || tripEnd === null) return [...programs];
  return programs.filter((program) => programOverlaps(program, tripStart, tripEnd));
}

/** Localized month-abbreviation token for a 1-based month index. */
export type MonthAbbrevResolver = (monthIndex1Based: number) => string;

export interface EligibilityTemplates {
  /** "valid {from}–{until}" — `{from}` / `{until}` get replaced. */
  range: string;
  /** "valid from {from}". */
  from: string;
  /** "valid until {until}". */
  until: string;
  month: MonthAbbrevResolver;
}

function formatDateLabel(
  d: Date,
  month: MonthAbbrevResolver,
  withDay: boolean,
  withYear: boolean,
): string {
  let label = month(d.getUTCMonth() + 1);
  if (withDay) label = `${label} ${d.getUTCDate()}`;
  if (withYear) label = `${label} ${d.getUTCFullYear()}`;
  return label;
}

/**
 * Short "valid …" eligibility label for a date-bounded benefit, or null.
 *
 * Returns null when both bounds are null/unparseable. Uses abbreviated month
 * names; includes the year only when the range crosses a year boundary or is
 * not the current year.
 */
export function formatBenefitEligibility(
  validFrom: string | null | undefined,
  validUntil: string | null | undefined,
  templates: EligibilityTemplates,
): string | null {
  const start = parseIsoDate(validFrom);
  const end = parseIsoDate(validUntil);
  if (start === null && end === null) return null;

  const currentYear = new Date().getUTCFullYear();
  if (start !== null && end !== null) {
    const crossesYear = start.getUTCFullYear() !== end.getUTCFullYear();
    const notCurrent =
      start.getUTCFullYear() !== currentYear || end.getUTCFullYear() !== currentYear;
    const withYear = crossesYear || notCurrent;
    const fromLabel = formatDateLabel(start, templates.month, false, withYear && crossesYear);
    const untilLabel = formatDateLabel(end, templates.month, false, withYear);
    return templates.range.replace('{from}', fromLabel).replace('{until}', untilLabel);
  }
  if (start !== null) {
    const withYear = start.getUTCFullYear() !== currentYear;
    const fromLabel = formatDateLabel(start, templates.month, true, withYear);
    return templates.from.replace('{from}', fromLabel);
  }
  const withYear = end!.getUTCFullYear() !== currentYear;
  const untilLabel = formatDateLabel(end!, templates.month, true, withYear);
  return templates.until.replace('{until}', untilLabel);
}

/** Build the eligibility-label templates from the app's translation function. */
export function buildEligibilityTemplates(t: (key: string) => string): EligibilityTemplates {
  return {
    range: t('hotel.benefit_eligibility_range'),
    from: t('hotel.benefit_eligibility_from'),
    until: t('hotel.benefit_eligibility_until'),
    month: (m: number) => t(`hotel.benefit_month_abbr_${m}`),
  };
}

/** One benefit program as rendered on the hotel page: heading + bullets. */
export interface BenefitGroup {
  /** Localized program name, or null for an unnamed program (no heading). */
  name: string | null;
  /** "valid …" label shown on the heading, or null. */
  eligibility: string | null;
  items: string[];
}

/**
 * Group programs for display (SMA-467): one group per program, in admin
 * order, with the program name localized (EN→KR fallback) and the
 * eligibility label computed ONCE per program — on the heading, not on every
 * bullet. Pass `templates: null` when stay dates have already been applied
 * (`filterBenefitsByDates`): the surviving programs need no label. Programs
 * with no non-empty bullet are dropped.
 */
export function groupBenefitPrograms(
  programs: HotelBenefitProgram[] | null | undefined,
  lang: 'en' | 'kr',
  templates: EligibilityTemplates | null,
): BenefitGroup[] {
  return (programs ?? []).flatMap((program) => {
    const items = program.benefits
      .map((benefit) => getLocalizedText(benefit, lang))
      .filter(Boolean);
    if (items.length === 0) return [];
    const name = getLocalizedText(program.program_name, lang) || null;
    const eligibility = templates
      ? formatBenefitEligibility(program.valid_from, program.valid_until, templates)
      : null;
    return [{ name, eligibility, items }];
  });
}
