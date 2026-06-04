import { describe, expect, it } from 'vitest';
import { shouldShowDreamHotelsMap } from '@/lib/dream-hotels-map';
import type { DestinationSuggestion } from '@/types/destination';

const destination: DestinationSuggestion = {
  id: 7,
  type: 'city',
  name: { en: 'Paris', kr: 'Paris' },
};

describe('shouldShowDreamHotelsMap', () => {
  it('no filters → false', () => {
    expect(shouldShowDreamHotelsMap('', null)).toBe(false);
  });

  it('whitespace-only search with no destination → false', () => {
    expect(shouldShowDreamHotelsMap('   ', null)).toBe(false);
  });

  it('search only → true', () => {
    expect(shouldShowDreamHotelsMap('Ritz', null)).toBe(true);
  });

  it('destination only → true', () => {
    expect(shouldShowDreamHotelsMap('', destination)).toBe(true);
  });

  it('search + destination → true', () => {
    expect(shouldShowDreamHotelsMap('Ritz', destination)).toBe(true);
  });

  it('search empty after typing (cleared) → false', () => {
    expect(shouldShowDreamHotelsMap('', null)).toBe(false);
  });

  // Star rating is intentionally NOT a parameter of the gate. A star-only
  // selection (no search, no destination) is the same as no filters → false.
  it('star only → false (star excluded from the gate)', () => {
    expect(shouldShowDreamHotelsMap('', null)).toBe(false);
  });

  // "All three" = search + destination + star. Star never enters the helper,
  // so this collapses to search + destination → true.
  it('all three (search + destination + star) → true', () => {
    expect(shouldShowDreamHotelsMap('Ritz', destination)).toBe(true);
  });
});
