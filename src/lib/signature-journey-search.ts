import { getLocalizedText } from '@/types/common';
import type { City } from '@/types/location';
import type { SignatureJourney } from '@/types/signatureJourney';

/**
 * Pure helpers behind the /signature-journeys unified typeahead (SMA-229).
 *
 * The search itself is server-side (`GET /api/v2/signature-journeys?q=`, which
 * matches journey titles AND city names across EN + KR). These helpers only
 * shape the loaded journeys into the suggestion groups the panel renders, and
 * restrict the offered cities to those that actually have a journey.
 */

/** A city suggestion — always a "related" city (>= 1 published journey). */
export interface CitySuggestion {
  id: number;
  name: string;
}

/** A journey suggestion; `cityName` is omitted when the city is unknown. */
export interface JourneySuggestion {
  id: number;
  slug: string;
  title: string;
  cityName?: string;
}

export interface SignatureJourneySuggestions {
  cities: CitySuggestion[];
  journeys: JourneySuggestion[];
}

/**
 * Cities that have at least one journey in `journeys`, preserving the order of
 * the `cities` catalog. Derived from the journeys themselves — never from a
 * `getCities` limit — so a journey-less city is never offered.
 */
export function deriveRelatedCities(journeys: SignatureJourney[], cities: City[]): City[] {
  const relatedCityIds = new Set<number>();
  for (const journey of journeys) {
    if (typeof journey.city_id === 'number') relatedCityIds.add(journey.city_id);
  }
  return cities.filter((city) => relatedCityIds.has(city.id));
}

/**
 * Group the given journeys into deduped city + journey suggestions.
 *
 * `cityNameById` must be built from the RELATED cities only, so any city id it
 * doesn't know is either journey-less or missing from the city catalog — in
 * both cases the city suggestion is omitted rather than rendered blank (the
 * journey itself still appears).
 */
export function buildSuggestions(
  journeys: SignatureJourney[],
  cityNameById: Map<number, string>,
  lang: 'en' | 'kr' = 'en',
): SignatureJourneySuggestions {
  const cities: CitySuggestion[] = [];
  const seenCityIds = new Set<number>();
  const journeySuggestions: JourneySuggestion[] = [];
  const seenJourneyIds = new Set<number>();

  for (const journey of journeys) {
    const cityId = typeof journey.city_id === 'number' ? journey.city_id : null;
    const cityName = cityId !== null ? cityNameById.get(cityId) : undefined;

    if (cityId !== null && cityName && !seenCityIds.has(cityId)) {
      seenCityIds.add(cityId);
      cities.push({ id: cityId, name: cityName });
    }

    if (seenJourneyIds.has(journey.id)) continue;
    const title = getLocalizedText(journey.title, lang);
    if (!title) continue;
    seenJourneyIds.add(journey.id);
    journeySuggestions.push({
      id: journey.id,
      slug: journey.slug,
      title,
      ...(cityName ? { cityName } : {}),
    });
  }

  return { cities, journeys: journeySuggestions };
}
