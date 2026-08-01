import { describe, expect, it } from 'vitest';
import { buildSuggestions, deriveRelatedCities } from '@/lib/signature-journey-search';
import type { SignatureJourney } from '@/types/signatureJourney';
import type { City } from '@/types/location';

function journey(overrides: Partial<SignatureJourney> & { id: number }): SignatureJourney {
  return {
    slug: `journey-${overrides.id}`,
    status: 'published',
    schema_version: 1,
    title: { en: `Journey ${overrides.id}`, kr: `여정 ${overrides.id}` },
    ...overrides,
  };
}

function city(id: number, en: string, kr: string): City {
  return {
    id,
    name: { en, kr },
    slug: en.toLowerCase(),
    region_id: 1,
    status: true,
    link_services: true,
    schema_version: 1,
  };
}

const monaco = city(10, 'Monaco', '모나코');
const maldives = city(20, 'Maldives', '몰디브');
const seoul = city(30, 'Seoul', '서울');

describe('deriveRelatedCities', () => {
  it('keeps only cities that have at least one journey', () => {
    const journeys = [journey({ id: 1, city_id: 10 }), journey({ id: 2, city_id: 20 })];

    const related = deriveRelatedCities(journeys, [monaco, maldives, seoul]);

    expect(related.map((c) => c.id)).toEqual([10, 20]);
  });

  it('ignores journeys with a null or missing city_id', () => {
    const journeys = [
      journey({ id: 1, city_id: null }),
      journey({ id: 2 }),
      journey({ id: 3, city_id: 30 }),
    ];

    const related = deriveRelatedCities(journeys, [monaco, maldives, seoul]);

    expect(related.map((c) => c.id)).toEqual([30]);
  });

  it('returns nothing when there are no journeys', () => {
    expect(deriveRelatedCities([], [monaco, maldives])).toEqual([]);
  });
});

describe('buildSuggestions', () => {
  const cityNameById = new Map([
    [10, 'Monaco'],
    [20, 'Maldives'],
  ]);

  it('groups cities and journeys, deduping repeated cities', () => {
    const journeys = [
      journey({ id: 1, city_id: 10, title: { en: 'Ritz Yacht', kr: '리츠 요트' } }),
      journey({ id: 2, city_id: 10, title: { en: 'Four Seasons Yachts', kr: '포시즌스 요트' } }),
      journey({ id: 3, city_id: 20, title: { en: 'Amangati', kr: '아만가티' } }),
    ];

    const result = buildSuggestions(journeys, cityNameById);

    expect(result.cities).toEqual([
      { id: 10, name: 'Monaco' },
      { id: 20, name: 'Maldives' },
    ]);
    expect(result.journeys.map((j) => j.title)).toEqual([
      'Ritz Yacht',
      'Four Seasons Yachts',
      'Amangati',
    ]);
    expect(result.journeys[0].cityName).toBe('Monaco');
  });

  it('omits the city suggestion when the city is missing from the name map, keeping the journey', () => {
    const journeys = [
      journey({ id: 7, city_id: 999, title: { en: 'Orphan Voyage', kr: '고아 여정' } }),
    ];

    const result = buildSuggestions(journeys, cityNameById);

    expect(result.cities).toEqual([]);
    expect(result.journeys).toEqual([{ id: 7, slug: 'journey-7', title: 'Orphan Voyage' }]);
  });

  it('skips journeys with no resolvable title', () => {
    const journeys = [
      journey({ id: 1, city_id: 10, title: null }),
      journey({ id: 2, city_id: 10, title: { en: '', kr: '' } }),
      journey({ id: 3, city_id: 10, title: { en: 'Real Journey', kr: '진짜 여정' } }),
    ];

    const result = buildSuggestions(journeys, cityNameById);

    expect(result.journeys.map((j) => j.id)).toEqual([3]);
    // The city is still offered — its journeys exist even if one has no title.
    expect(result.cities).toEqual([{ id: 10, name: 'Monaco' }]);
  });

  it('localizes journey titles with the requested language', () => {
    const journeys = [
      journey({ id: 1, city_id: 10, title: { en: 'Ritz Yacht', kr: '리츠 요트' } }),
    ];

    const result = buildSuggestions(journeys, new Map([[10, '모나코']]), 'kr');

    expect(result.journeys[0].title).toBe('리츠 요트');
    expect(result.journeys[0].cityName).toBe('모나코');
    expect(result.cities).toEqual([{ id: 10, name: '모나코' }]);
  });

  it('dedupes journeys that appear twice in the input', () => {
    const dup = journey({ id: 1, city_id: 10, title: { en: 'Ritz Yacht', kr: '리츠 요트' } });

    const result = buildSuggestions([dup, dup], cityNameById);

    expect(result.journeys).toHaveLength(1);
    expect(result.cities).toHaveLength(1);
  });
});
