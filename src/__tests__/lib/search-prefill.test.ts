import { describe, expect, it } from 'vitest';
import en from '@/translations/en.json';
import kr from '@/translations/kr.json';
import {
  buildPrefillSeedMessage,
  buildPrefillTripVersion,
  mapTripTypeToPurpose,
  parseSearchPrefill,
  type SearchPrefill,
} from '@/lib/search-prefill';

function paramsFrom(record: Record<string, string>) {
  return new URLSearchParams(record);
}

const enT = (key: string) => (en as Record<string, string>)[key] ?? key;
const krT = (key: string) => (kr as Record<string, string>)[key] ?? key;

describe('parseSearchPrefill', () => {
  it('returns null when the prefill flag is absent', () => {
    expect(parseSearchPrefill(paramsFrom({}))).toBeNull();
    expect(parseSearchPrefill(paramsFrom({ city: 'Paris' }))).toBeNull();
  });

  it('parses all fields from the SearchBar query', () => {
    const parsed = parseSearchPrefill(
      paramsFrom({
        prefill: '1',
        cityId: '7',
        city: 'Paris',
        destinationType: 'city',
        checkIn: '2026-06-01',
        checkOut: '2026-06-07',
        adults: '3',
        children: '1',
        tripType: 'Leisure',
        travelStyle: 'Romantic Escape',
      }),
    );

    expect(parsed).toEqual({
      cityId: 7,
      cityName: 'Paris',
      destinationType: 'city',
      checkIn: '2026-06-01',
      checkOut: '2026-06-07',
      adults: 3,
      kids: 1,
      tripType: 'Leisure',
      travelStyle: 'Romantic Escape',
    });
  });

  it('handles a prefill with only the bare prefill flag — defaults adults=2/kids=0', () => {
    const parsed = parseSearchPrefill(paramsFrom({ prefill: '1' }));
    expect(parsed).toEqual({
      cityId: null,
      cityName: null,
      destinationType: null,
      checkIn: null,
      checkOut: null,
      adults: 2,
      kids: 0,
      tripType: null,
      travelStyle: null,
    });
  });

  it('drops a non-numeric cityId rather than coercing it to NaN', () => {
    const parsed = parseSearchPrefill(
      paramsFrom({ prefill: '1', cityId: 'abc', destinationType: 'city' }),
    );
    expect(parsed?.cityId).toBeNull();
  });

  it('does NOT keep cityId for a country destination (no cityId poisoning)', () => {
    // SearchBar never emits cityId for a country, but guard against a stray one.
    const parsed = parseSearchPrefill(
      paramsFrom({ prefill: '1', city: 'France', destinationType: 'country', cityId: '99' }),
    );
    expect(parsed?.cityId).toBeNull();
    expect(parsed?.destinationType).toBe('country');
    expect(parsed?.cityName).toBe('France');
  });

  it('does NOT keep cityId for a region destination (no cityId poisoning)', () => {
    const parsed = parseSearchPrefill(
      paramsFrom({
        prefill: '1',
        city: 'Ile-de-France',
        destinationType: 'region',
        cityId: '55',
      }),
    );
    expect(parsed?.cityId).toBeNull();
    expect(parsed?.destinationType).toBe('region');
  });

  it('ignores an unknown destinationType value', () => {
    const parsed = parseSearchPrefill(paramsFrom({ prefill: '1', destinationType: 'continent' }));
    expect(parsed?.destinationType).toBeNull();
  });
});

describe('mapTripTypeToPurpose', () => {
  it('maps SearchBar values onto the backend purpose enum', () => {
    expect(mapTripTypeToPurpose('Leisure')).toBe('leisure');
    expect(mapTripTypeToPurpose('Business')).toBe('business');
    expect(mapTripTypeToPurpose('Bleisure')).toBe('business');
  });

  it('returns null for unknown or empty inputs', () => {
    expect(mapTripTypeToPurpose(null)).toBeNull();
    expect(mapTripTypeToPurpose('')).toBeNull();
    expect(mapTripTypeToPurpose('Family')).toBeNull();
  });
});

describe('buildPrefillTripVersion', () => {
  function makePrefill(overrides: Partial<SearchPrefill> = {}): SearchPrefill {
    return {
      cityId: null,
      cityName: null,
      destinationType: null,
      checkIn: null,
      checkOut: null,
      adults: 2,
      kids: 0,
      tripType: null,
      travelStyle: null,
      ...overrides,
    };
  }

  it('builds the full payload when every field is populated', () => {
    const version = buildPrefillTripVersion(
      makePrefill({
        cityId: 7,
        cityName: 'Paris',
        destinationType: 'city',
        checkIn: '2026-06-01',
        checkOut: '2026-06-07',
        adults: 2,
        kids: 1,
        tripType: 'Leisure',
      }),
    );

    expect(version.title).toBe('Paris');
    expect(version.start_date).toBe('2026-06-01');
    expect(version.end_date).toBe('2026-06-07');
    expect(version.adults).toBe(2);
    expect(version.kids).toBe(1);
    expect(version.trip_preferences).toEqual([
      {
        type: 'custom',
        key: 'destination_city_ids',
        value: '7',
        label: 'Matched destination cities',
      },
      { type: 'purpose', value: 'leisure' },
    ]);
  });

  it('omits dates and trip_preferences when nothing matched', () => {
    const version = buildPrefillTripVersion(makePrefill());

    expect(version.title).toBe('New Trip');
    expect(version.start_date).toBeUndefined();
    expect(version.end_date).toBeUndefined();
    expect(version.trip_preferences).toBeUndefined();
  });

  it('routes a COUNTRY destination to custom_destinations (by name), NOT destination_city_ids', () => {
    const version = buildPrefillTripVersion(
      makePrefill({ cityId: null, cityName: 'France', destinationType: 'country' }),
    );

    expect(version.title).toBe('France');
    expect(version.trip_preferences).toEqual([
      {
        type: 'custom',
        key: 'custom_destinations',
        value: 'France',
        label: 'Custom destinations',
      },
    ]);
    // Crucially, no city-id preference is emitted for a country.
    const prefs = version.trip_preferences ?? [];
    expect(prefs.find((p) => 'key' in p && p.key === 'destination_city_ids')).toBeUndefined();
  });

  it('routes a REGION destination to custom_destinations (by name), NOT destination_city_ids', () => {
    const version = buildPrefillTripVersion(
      makePrefill({ cityId: null, cityName: 'Ile-de-France', destinationType: 'region' }),
    );

    expect(version.trip_preferences).toEqual([
      {
        type: 'custom',
        key: 'custom_destinations',
        value: 'Ile-de-France',
        label: 'Custom destinations',
      },
    ]);
  });

  it('maps Bleisure trip type to business purpose', () => {
    const version = buildPrefillTripVersion(makePrefill({ tripType: 'Bleisure' }));
    expect(version.trip_preferences).toEqual([{ type: 'purpose', value: 'business' }]);
  });

  it('does NOT include travel_style in trip_preferences (UI-only field)', () => {
    const version = buildPrefillTripVersion(
      makePrefill({ travelStyle: 'Romantic Escape', tripType: 'Leisure' }),
    );
    const prefs = version.trip_preferences ?? [];
    expect(prefs.find((p) => 'value' in p && p.value === 'Romantic Escape')).toBeUndefined();
  });
});

describe('buildPrefillSeedMessage', () => {
  function makePrefill(overrides: Partial<SearchPrefill> = {}): SearchPrefill {
    return {
      cityId: null,
      cityName: null,
      destinationType: null,
      checkIn: null,
      checkOut: null,
      adults: 2,
      kids: 0,
      tripType: null,
      travelStyle: null,
      ...overrides,
    };
  }

  it('produces the natural English sentence when every field is filled', () => {
    const msg = buildPrefillSeedMessage(
      makePrefill({
        cityName: 'Paris',
        checkIn: '2026-06-01',
        checkOut: '2026-06-07',
        adults: 2,
        kids: 1,
        tripType: 'Leisure',
        travelStyle: 'Romantic Escape',
      }),
      enT,
      'en',
    );

    expect(msg).toContain('Paris');
    expect(msg).toContain('2026-06-01');
    expect(msg).toContain('2026-06-07');
    expect(msg).toContain('2 adults');
    expect(msg).toContain('1 child');
    expect(msg).toContain('Trip type: leisure');
    expect(msg).toContain('Travel style: Romantic Escape');
    expect(msg).not.toMatch(/\bundefined\b/);
    expect(msg).not.toMatch(/\bnull\b/);
    // No double space, no orphaned commas.
    expect(msg).not.toMatch(/ {2}/);
    expect(msg).not.toMatch(/, ,/);
  });

  it('omits travel style cleanly when it is empty', () => {
    const msg = buildPrefillSeedMessage(
      makePrefill({
        cityName: 'Paris',
        checkIn: '2026-06-01',
        checkOut: '2026-06-07',
        adults: 2,
        kids: 0,
        tripType: 'Leisure',
      }),
      enT,
      'en',
    );

    expect(msg).not.toContain('Travel style');
    expect(msg).toContain('Paris');
    expect(msg).toContain('2 adults');
    expect(msg).not.toMatch(/\bundefined\b/);
    expect(msg).not.toMatch(/, ,/);
  });

  it('falls back to the no-destination intro when city is missing', () => {
    const msg = buildPrefillSeedMessage(
      makePrefill({
        cityName: null,
        checkIn: '2026-06-01',
        checkOut: '2026-06-07',
        adults: 2,
        tripType: 'Leisure',
      }),
      enT,
      'en',
    );

    expect(msg.startsWith('I want to plan a trip')).toBe(true);
    expect(msg).not.toContain(' to undefined');
    expect(msg).toContain('2026-06-01');
    expect(msg).toContain('2 adults');
    expect(msg).not.toMatch(/\bundefined\b/);
  });

  it('drops the dates fragment entirely when one or both dates are missing', () => {
    const msg = buildPrefillSeedMessage(
      makePrefill({
        cityName: 'Paris',
        checkIn: '2026-06-01',
        checkOut: null,
        adults: 2,
      }),
      enT,
      'en',
    );

    expect(msg).not.toContain('from 2026-06-01');
    expect(msg).not.toMatch(/\bundefined\b/);
  });

  it('renders a natural Korean sentence with every field filled', () => {
    const msg = buildPrefillSeedMessage(
      makePrefill({
        cityName: '파리',
        checkIn: '2026-06-01',
        checkOut: '2026-06-07',
        adults: 2,
        kids: 1,
        tripType: 'Leisure',
        travelStyle: 'Romantic Escape',
      }),
      krT,
      'kr',
    );

    expect(msg).toContain('파리');
    expect(msg).toContain('계획하고 싶습니다');
    expect(msg).toContain('성인 2명');
    expect(msg).toContain('어린이 1명');
    expect(msg).toContain('여행 목적: leisure');
    expect(msg).toContain('여행 스타일: Romantic Escape');
    expect(msg).not.toMatch(/\bundefined\b/);
    expect(msg).not.toMatch(/\bnull\b/);
    expect(msg).not.toMatch(/, ,/);
  });

  it('renders Korean with missing optional fields cleanly', () => {
    const msg = buildPrefillSeedMessage(
      makePrefill({
        cityName: null,
        adults: 1,
        kids: 0,
      }),
      krT,
      'kr',
    );

    expect(msg).toContain('계획하고 싶습니다');
    expect(msg).toContain('성인 1명');
    expect(msg).not.toContain('어린이');
    expect(msg).not.toContain('여행 목적');
    expect(msg).not.toContain('여행 스타일');
    expect(msg).not.toMatch(/\bundefined\b/);
  });

  it('uses singular adult/child wording in EN for n=1', () => {
    const msg = buildPrefillSeedMessage(
      makePrefill({ cityName: 'Paris', adults: 1, kids: 1 }),
      enT,
      'en',
    );

    expect(msg).toContain('1 adult');
    expect(msg).not.toContain('1 adults');
    expect(msg).toContain('1 child');
    expect(msg).not.toContain('1 children');
  });
});
