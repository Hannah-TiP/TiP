import { describe, it, expect } from 'vitest';
import {
  buildSitemap,
  magazineArticleSitemapEntry,
  STATIC_SITEMAP_PATHS,
} from '@/lib/seo/sitemap-builder';
import { SITE_ORIGIN } from '@/lib/seo/locale';
import type { MagazineArticle } from '@/types/magazine';
import type { SitemapEntry } from '@/lib/seo/sitemap-fetch';

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

const origin = SITE_ORIGIN.replace(/\/$/, '');

describe('magazineArticleSitemapEntry', () => {
  it('maps the type enum to its plural URL segment', () => {
    expect(magazineArticleSitemapEntry(article({ type: 'destination', slug: 'japan' })).path).toBe(
      '/magazine/destinations/japan',
    );
    expect(magazineArticleSitemapEntry(article({ type: 'collection', slug: 'x' })).path).toBe(
      '/magazine/collections/x',
    );
    expect(magazineArticleSitemapEntry(article({ type: 'insider', slug: 'y' })).path).toBe(
      '/magazine/insider/y',
    );
  });

  it('carries updated_at as lastModified', () => {
    const entry = magazineArticleSitemapEntry(article({ updated_at: '2026-05-01T00:00:00Z' }));
    expect(entry.lastModified).toBe('2026-05-01T00:00:00Z');
  });
});

describe('buildSitemap', () => {
  const hotels: SitemapEntry[] = [
    { path: '/hotel/aman-tokyo', lastModified: '2026-04-01T00:00:00Z' },
  ];
  const journeys: SitemapEntry[] = [{ path: '/signature-journeys/kyoto' }];
  const articles = [article({ type: 'guide', slug: 'tokyo-guide', updated_at: '2026-03-01Z' })];

  const sitemap = buildSitemap(STATIC_SITEMAP_PATHS, hotels, articles, journeys);

  it('emits absolute URLs on SITE_ORIGIN', () => {
    expect(sitemap.every((e) => e.url.startsWith(origin))).toBe(true);
  });

  it('includes the static routes with NO lastModified', () => {
    const magazineRoot = sitemap.find((e) => e.url === `${origin}/magazine`);
    expect(magazineRoot).toBeDefined();
    expect(magazineRoot?.lastModified).toBeUndefined();
    expect(sitemap.some((e) => e.url === `${origin}/`)).toBe(true);
    expect(sitemap.some((e) => e.url === `${origin}/dream-hotels`)).toBe(true);
  });

  it('includes dynamic hotel / article / journey URLs with lastModified when provided', () => {
    const hotel = sitemap.find((e) => e.url === `${origin}/hotel/aman-tokyo`);
    expect(hotel?.lastModified).toBe('2026-04-01T00:00:00Z');
    expect(sitemap.some((e) => e.url === `${origin}/magazine/guides/tokyo-guide`)).toBe(true);
    const journey = sitemap.find((e) => e.url === `${origin}/signature-journeys/kyoto`);
    expect(journey).toBeDefined();
    expect(journey?.lastModified).toBeUndefined();
  });
});
