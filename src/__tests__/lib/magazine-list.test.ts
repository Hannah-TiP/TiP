import { describe, it, expect } from 'vitest';
import { magazineArticlesQuery } from '@/lib/magazine-list';

describe('magazineArticlesQuery', () => {
  it('omits every param when the filter state is empty', () => {
    expect(magazineArticlesQuery({}).toString()).toBe('');
  });

  it('maps active facet filters to query params', () => {
    const query = magazineArticlesQuery({
      type: 'destination',
      country_id: 3,
      city_id: 7,
      brand_id: 9,
      tag: 'honeymoon',
      language: 'kr',
      page: 2,
      per_page: 12,
    });
    expect(query.get('type')).toBe('destination');
    expect(query.get('country_id')).toBe('3');
    expect(query.get('city_id')).toBe('7');
    expect(query.get('brand_id')).toBe('9');
    expect(query.get('tag')).toBe('honeymoon');
    expect(query.get('language')).toBe('kr');
    expect(query.get('page')).toBe('2');
    expect(query.get('per_page')).toBe('12');
  });

  it('omits null / "All" type but keeps a zero-valued id', () => {
    const query = magazineArticlesQuery({ type: null, country_id: 0 });
    expect(query.has('type')).toBe(false);
    // 0 is a valid id (not null) — must be forwarded.
    expect(query.get('country_id')).toBe('0');
  });

  it('omits an empty-string tag', () => {
    const query = magazineArticlesQuery({ tag: '' });
    expect(query.has('tag')).toBe(false);
  });
});
