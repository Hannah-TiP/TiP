import { describe, it, expect } from 'vitest';
import { guideSteps, insiderTopic, newsCategory } from '@/lib/magazine-payload';
import type { MagazineArticle } from '@/types/magazine';

function article(type_payload: MagazineArticle['type_payload']): MagazineArticle {
  return {
    id: 1,
    type: 'guide',
    slug: 'x',
    status: 'published',
    tags: [],
    schema_version: 1,
    type_payload,
  };
}

describe('guideSteps', () => {
  it('normalizes step objects and drops non-object entries', () => {
    const steps = guideSteps(
      article({
        steps: [
          { label: 'Day 1', title: { en: 'A' }, body: { en: 'b' }, hotel_id: 5 },
          'not-a-step',
          { label: 42, hotel_id: 'nope' },
        ],
      }),
    );
    expect(steps).toEqual([
      { label: 'Day 1', title: { en: 'A' }, body: { en: 'b' }, hotel_id: 5 },
      { label: null, title: null, body: null, hotel_id: null },
    ]);
  });

  it('returns [] for a missing / malformed payload (forward-compat)', () => {
    expect(guideSteps(article(null))).toEqual([]);
    expect(guideSteps(article({ steps: 'nope' }))).toEqual([]);
    expect(guideSteps(article({}))).toEqual([]);
  });
});

describe('newsCategory / insiderTopic', () => {
  it('returns the known enum value, else null', () => {
    expect(newsCategory(article({ category: 'opening' }))).toBe('opening');
    expect(newsCategory(article({ category: 'bogus' }))).toBeNull();
    expect(newsCategory(article(null))).toBeNull();

    expect(insiderTopic(article({ topic: 'behind_the_scenes' }))).toBe('behind_the_scenes');
    expect(insiderTopic(article({ topic: 'bogus' }))).toBeNull();
    expect(insiderTopic(article(null))).toBeNull();
  });
});
