/**
 * SearchBar → Concierge prefill helpers.
 *
 * The homepage SearchBar routes to `/concierge?prefill=1&...` with the
 * user's search values. The concierge page picks those values up, creates
 * a brand-new trip + chat session pre-filled with them, and seeds an
 * initial user message describing the request so the AI has full context
 * from turn one.
 */

import type { Lang } from '@/contexts/LanguageContext';
import type { TripPreference, TripVersion } from '@/types/trip';

export interface SearchPrefill {
  cityId: number | null;
  cityName: string | null;
  /**
   * The 3-level type of the destination the user picked. The backend concierge
   * prefill only understands city-level destination ids, so a `country` /
   * `region` selection carries its NAME through `custom_destinations` instead
   * of poisoning `destination_city_ids` with a non-city id.
   */
  destinationType: 'country' | 'region' | 'city' | null;
  checkIn: string | null;
  checkOut: string | null;
  adults: number;
  kids: number;
  tripType: string | null; // raw SearchBar value: "Leisure" | "Business" | "Bleisure" | ...
  travelStyle: string | null; // raw SearchBar value, UI-only — does not persist
}

/**
 * Parse a `URLSearchParams` instance produced by SearchBar. Returns `null`
 * when the `prefill` flag is absent so callers can short-circuit.
 *
 * Numeric fields default conservatively (adults=2, kids=0) to match the
 * SearchBar's own defaults — any value the user actually picked still
 * comes through as the explicit query param.
 */
export function parseSearchPrefill(
  params: URLSearchParams | { get: (k: string) => string | null },
): SearchPrefill | null {
  if (!params.get('prefill')) return null;

  const cityIdRaw = params.get('cityId');
  const cityIdNum = cityIdRaw ? Number.parseInt(cityIdRaw, 10) : NaN;

  const adultsRaw = params.get('adults');
  const adultsNum = adultsRaw ? Number.parseInt(adultsRaw, 10) : NaN;

  const childrenRaw = params.get('children');
  const childrenNum = childrenRaw ? Number.parseInt(childrenRaw, 10) : NaN;

  const destinationTypeRaw = params.get('destinationType');
  const destinationType =
    destinationTypeRaw === 'country' ||
    destinationTypeRaw === 'region' ||
    destinationTypeRaw === 'city'
      ? destinationTypeRaw
      : null;

  return {
    // Only a city-typed destination yields a real city id; SearchBar never
    // emits `cityId` for country/region selections, so this stays null there.
    cityId:
      destinationType === 'city' && Number.isFinite(cityIdNum) && cityIdNum > 0 ? cityIdNum : null,
    cityName: params.get('city'),
    destinationType,
    checkIn: params.get('checkIn'),
    checkOut: params.get('checkOut'),
    adults: Number.isFinite(adultsNum) && adultsNum > 0 ? adultsNum : 2,
    kids: Number.isFinite(childrenNum) && childrenNum >= 0 ? childrenNum : 0,
    tripType: params.get('tripType'),
    travelStyle: params.get('travelStyle'),
  };
}

/**
 * Map the user-facing SearchBar trip-type label onto the backend purpose
 * enum value. `Bleisure` collapses into `business` until/unless a
 * dedicated backend enum value exists.
 *
 * Returns `null` for unknown values so the caller can omit the
 * preference entirely rather than pushing a bogus purpose.
 */
export function mapTripTypeToPurpose(tripType: string | null | undefined): string | null {
  if (!tripType) return null;
  const normalized = tripType.trim().toLowerCase();
  if (normalized === 'leisure') return 'leisure';
  if (normalized === 'business' || normalized === 'bleisure') return 'business';
  return null;
}

/**
 * Build the `Partial<TripVersion>` payload that gets passed to
 * `apiClient.createTrip()` so the new trip lands pre-filled with the
 * SearchBar values.
 *
 * - `title` is set to the destination city name when present — this is
 *   what the TripDetailPanel renders as the "Destination" row.
 * - `start_date` / `end_date` only land when the user actually picked
 *   dates (empty strings drop out so backend validation doesn't barf).
 * - `trip_preferences` carries the matched destination city id (when
 *   the user selected a real city) and the mapped purpose.
 *
 * Travel style is intentionally omitted — it's UI-only and rides only
 * in the seed message per task spec.
 */
export function buildPrefillTripVersion(prefill: SearchPrefill): Partial<TripVersion> {
  const prefs: TripPreference[] = [];

  if (prefill.cityId !== null) {
    // City-level: the backend resolves these ids to cities directly.
    prefs.push({
      type: 'custom',
      key: 'destination_city_ids',
      value: String(prefill.cityId),
      label: 'Matched destination cities',
    });
  } else if (
    (prefill.destinationType === 'country' || prefill.destinationType === 'region') &&
    prefill.cityName?.trim()
  ) {
    // Country / region-level: the backend concierge prefill has no
    // country/region id support, so carry the destination by NAME via
    // `custom_destinations` (free-text) rather than poisoning
    // `destination_city_ids` with a non-city id. The AI resolves the named
    // region/country to concrete cities from turn one.
    prefs.push({
      type: 'custom',
      key: 'custom_destinations',
      value: prefill.cityName.trim(),
      label: 'Custom destinations',
    });
  }

  const purpose = mapTripTypeToPurpose(prefill.tripType);
  if (purpose) {
    prefs.push({ type: 'purpose', value: purpose });
  }

  const version: Partial<TripVersion> = {
    adults: prefill.adults,
    kids: prefill.kids,
  };

  // Title doubles as the destination row in TripDetailPanel — fall back
  // to a generic label only when the user didn't pick a city so the
  // empty state still gets a reasonable header.
  version.title = prefill.cityName?.trim() || 'New Trip';

  if (prefill.checkIn) version.start_date = prefill.checkIn;
  if (prefill.checkOut) version.end_date = prefill.checkOut;

  if (prefs.length > 0) version.trip_preferences = prefs;

  return version;
}

/**
 * Render the initial user message that gets auto-sent into the new chat
 * session. Composed from per-fragment translation strings so any
 * missing piece drops out cleanly with no orphaned commas or
 * `undefined` substrings.
 *
 * Strategy: the first sentence is the verb sentence ("I want to plan a
 * trip [to {city}] [from {start} to {end}] [for {travelers}]."). Trip
 * type and travel style ride as standalone follow-on sentences so they
 * can each drop out cleanly when missing.
 *
 * The `t` parameter is the same `t()` returned by `useLanguage()` — we
 * accept it as a typed function so this module stays free of React
 * imports and is easy to unit-test against fake translation tables.
 *
 * Empty / missing fields are omitted entirely — no `undefined`, no
 * `null`, no orphaned commas, no double spaces.
 */
export type PrefillTranslator = (key: string) => string;

function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_match, name: string) => {
    const v = vars[name];
    return v === undefined || v === null ? '' : String(v);
  });
}

function buildTravelersFragment(prefill: SearchPrefill, t: PrefillTranslator): string | null {
  const hasAdults = prefill.adults > 0;
  const hasKids = prefill.kids > 0;
  if (!hasAdults && !hasKids) return null;

  const adultsPart = hasAdults
    ? fill(t(prefill.adults === 1 ? 'chat.prefill.adults_one' : 'chat.prefill.adults_other'), {
        n: prefill.adults,
      })
    : null;
  const kidsPart = hasKids
    ? fill(t(prefill.kids === 1 ? 'chat.prefill.kids_one' : 'chat.prefill.kids_other'), {
        n: prefill.kids,
      })
    : null;

  let combined: string;
  if (adultsPart && kidsPart) {
    combined = fill(t('chat.prefill.travelers_and'), { adults: adultsPart, kids: kidsPart });
  } else {
    // Exactly one is present — use whichever.
    combined = adultsPart ?? kidsPart!;
  }

  return fill(t('chat.prefill.travelers_for'), { travelers: combined });
}

export function buildPrefillSeedMessage(
  prefill: SearchPrefill,
  t: PrefillTranslator,
  lang: Lang,
): string {
  // First sentence — the intro picks the destination-aware variant when
  // we have one, then optional dates + travelers fragments tack on.
  const introTemplate = prefill.cityName
    ? t('chat.prefill.intro_with_destination')
    : t('chat.prefill.intro');
  const introSentence = fill(introTemplate, { city: prefill.cityName ?? '' });

  const sentenceParts: string[] = [introSentence];

  if (prefill.checkIn && prefill.checkOut) {
    sentenceParts.push(
      fill(t('chat.prefill.dates_fragment'), {
        startDate: prefill.checkIn,
        endDate: prefill.checkOut,
      }),
    );
  }

  const travelers = buildTravelersFragment(prefill, t);
  if (travelers) sentenceParts.push(travelers);

  // Joiner is a literal space — fine for both English and Korean (Korean
  // already encodes its own postpositions inside each fragment).
  const firstSentence = sentenceParts.join(' ') + '.';

  const sentences: string[] = [firstSentence];

  const purpose = mapTripTypeToPurpose(prefill.tripType);
  if (purpose) {
    sentences.push(fill(t('chat.prefill.trip_type_sentence'), { tripType: purpose }));
  }

  if (prefill.travelStyle) {
    sentences.push(fill(t('chat.prefill.travel_style_sentence'), { style: prefill.travelStyle }));
  }

  // `lang` is plumbed through in case future variants need it (e.g. KR
  // postposition rules that depend on the noun's final character).
  void lang;

  return sentences.join(' ').trim();
}
