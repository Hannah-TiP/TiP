import { describe, it, expect } from 'vitest';
import {
  linkedHotelRelations,
  parentArticleRelation,
  rankedHotelRelations,
} from '@/lib/magazine-relations';
import type { ExpandedArticleRelation } from '@/types/magazine';

function hotelRel(
  kind: ExpandedArticleRelation['kind'],
  position: number,
  slug: string,
  hasHotel = true,
): ExpandedArticleRelation {
  return {
    id: position,
    target_type: 'hotel',
    target_id: position,
    kind,
    position,
    schema_version: 1,
    hotel: hasHotel ? { id: position, slug, name: { en: slug, kr: null } } : null,
  };
}

function articleRel(kind: ExpandedArticleRelation['kind'], slug: string): ExpandedArticleRelation {
  return {
    id: 500,
    target_type: 'article',
    target_id: 500,
    kind,
    position: 0,
    schema_version: 1,
    article: { id: 500, type: 'collection', slug, title: { en: slug, kr: null } },
  };
}

describe('rankedHotelRelations', () => {
  it('returns only ranked hotel relations, sorted by position', () => {
    const result = rankedHotelRelations([
      hotelRel('ranked', 3, 'c'),
      hotelRel('linked', 1, 'ignored-linked'),
      hotelRel('ranked', 1, 'a'),
      hotelRel('ranked', 2, 'b'),
    ]);
    expect(result.map((r) => r.hotel!.slug)).toEqual(['a', 'b', 'c']);
  });

  it('drops ranked relations with no expanded hotel target', () => {
    const result = rankedHotelRelations([hotelRel('ranked', 1, 'x', false)]);
    expect(result).toEqual([]);
  });

  it('returns [] for null/empty relations', () => {
    expect(rankedHotelRelations(null)).toEqual([]);
    expect(rankedHotelRelations(undefined)).toEqual([]);
    expect(rankedHotelRelations([])).toEqual([]);
  });
});

describe('linkedHotelRelations', () => {
  it('returns only linked hotel relations in position order', () => {
    const result = linkedHotelRelations([
      hotelRel('linked', 2, 'b'),
      hotelRel('ranked', 1, 'ignored-ranked'),
      hotelRel('linked', 1, 'a'),
    ]);
    expect(result.map((r) => r.hotel!.slug)).toEqual(['a', 'b']);
  });
});

describe('parentArticleRelation', () => {
  it('returns the parent article ref', () => {
    const parent = parentArticleRelation([
      hotelRel('ranked', 1, 'x'),
      articleRel('parent', 'the-cluster'),
    ]);
    expect(parent?.slug).toBe('the-cluster');
  });

  it('returns null when there is no parent relation', () => {
    expect(parentArticleRelation([hotelRel('ranked', 1, 'x')])).toBeNull();
    expect(parentArticleRelation(null)).toBeNull();
  });
});
