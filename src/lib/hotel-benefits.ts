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

interface EligibilityTemplates {
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
