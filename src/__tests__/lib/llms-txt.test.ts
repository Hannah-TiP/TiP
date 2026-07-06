import { describe, it, expect } from 'vitest';
import { buildLlmsTxt } from '@/lib/seo/llms-txt';
import { SITE_ORIGIN } from '@/lib/seo/locale';
import { TRAVEL_AGENCY_DESCRIPTION } from '@/lib/seo/signature-journey-jsonld';
import type { MagazineArticle } from '@/types/magazine';

const origin = SITE_ORIGIN.replace(/\/$/, '');

function article(overrides: Partial<MagazineArticle>): MagazineArticle {
  return {
    id: 1,
    type: 'destination',
    slug: 'japan',
    status: 'published',
    tags: [],
    schema_version: 1,
    ...overrides,
  };
}

describe('buildLlmsTxt', () => {
  const txt = buildLlmsTxt([
    article({ slug: 'japan', title: { en: 'Best hotels in Japan', kr: '일본 최고의 호텔' } }),
    article({ slug: 'italy', title: { en: 'Italy guide' } }),
  ]);

  it('opens with the entity H1 and the byte-identical description blockquote', () => {
    expect(txt).toContain('# Travel in Your Pocket (TiP)');
    expect(txt).toContain(`> ${TRAVEL_AGENCY_DESCRIPTION}`);
  });

  it('carries the entity facts (Paris Class parent, Virtuoso, IATA)', () => {
    expect(txt).toContain('Paris Class');
    expect(txt).toContain('Virtuoso');
    expect(txt).toContain('17335835');
  });

  it('includes absolute key-section links', () => {
    expect(txt).toContain(`(${origin}/magazine)`);
    expect(txt).toContain(`(${origin}/dream-hotels)`);
    expect(txt).toContain(`(${origin}/signature-journeys)`);
  });

  it('lists published destination guides as markdown links with EN titles', () => {
    expect(txt).toContain(`- [Best hotels in Japan](${origin}/magazine/destinations/japan)`);
    expect(txt).toContain(`- [Italy guide](${origin}/magazine/destinations/italy)`);
  });

  it('skips a destination article that has no usable title', () => {
    const out = buildLlmsTxt([article({ slug: 'untitled', title: null })]);
    expect(out).not.toContain('/magazine/destinations/untitled');
  });
});
