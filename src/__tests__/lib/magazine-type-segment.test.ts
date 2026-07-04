import { describe, it, expect } from 'vitest';
import {
  TYPE_SEGMENT_TO_ENUM,
  TYPE_ENUM_TO_SEGMENT,
  typeEnumFromSegment,
  type MagazineArticleType,
} from '@/types/magazine';

describe('typeEnumFromSegment (plural → singular map)', () => {
  it('maps every published plural segment to its singular enum', () => {
    expect(typeEnumFromSegment('destinations')).toBe('destination');
    expect(typeEnumFromSegment('collections')).toBe('collection');
    expect(typeEnumFromSegment('guides')).toBe('guide');
    // news + insider are identical either side.
    expect(typeEnumFromSegment('news')).toBe('news');
    expect(typeEnumFromSegment('insider')).toBe('insider');
  });

  it('rejects unknown segments (⇒ null ⇒ notFound)', () => {
    expect(typeEnumFromSegment('destination')).toBeNull(); // singular is NOT a valid URL segment
    expect(typeEnumFromSegment('collection')).toBeNull();
    expect(typeEnumFromSegment('guide')).toBeNull();
    expect(typeEnumFromSegment('inserts')).toBeNull();
    expect(typeEnumFromSegment('')).toBeNull();
    expect(typeEnumFromSegment('HOTELS')).toBeNull();
  });

  it('the plural→singular and singular→plural maps are inverses', () => {
    for (const [segment, enumValue] of Object.entries(TYPE_SEGMENT_TO_ENUM)) {
      expect(TYPE_ENUM_TO_SEGMENT[enumValue]).toBe(segment);
    }
    const enums: MagazineArticleType[] = ['destination', 'collection', 'guide', 'news', 'insider'];
    for (const enumValue of enums) {
      expect(TYPE_SEGMENT_TO_ENUM[TYPE_ENUM_TO_SEGMENT[enumValue]]).toBe(enumValue);
    }
  });
});
