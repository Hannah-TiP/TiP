import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/seo/locale';
import { TYPE_ENUM_TO_SEGMENT, type MagazineArticle } from '@/types/magazine';
import type { SitemapEntry } from '@/lib/seo/sitemap-fetch';

/**
 * Static routes that always appear in the sitemap. `lastModified` is OMITTED for
 * these (we never fake a timestamp — a stable content page has no meaningful
 * last-modified from the app's perspective).
 */
export const STATIC_SITEMAP_PATHS = [
  '/',
  '/dream-hotels',
  '/signature-journeys',
  '/magazine',
  '/about',
  '/terms-of-service',
  '/privacy-policy',
] as const;

/**
 * Map a published magazine article row to a `/magazine/{typeSegment}/{slug}`
 * sitemap entry using the SINGLE-source-of-truth `TYPE_ENUM_TO_SEGMENT`
 * mapping. `lastModified = updated_at`.
 */
export function magazineArticleSitemapEntry(article: MagazineArticle): SitemapEntry {
  return {
    path: `/magazine/${TYPE_ENUM_TO_SEGMENT[article.type]}/${article.slug}`,
    lastModified: article.updated_at ?? undefined,
  };
}

/**
 * Assemble the full Next `MetadataRoute.Sitemap` from the static routes plus the
 * dynamic hotel / magazine / signature-journey entries. Every URL is absolute
 * on `SITE_ORIGIN`; `lastModified` is included only when the source provided it
 * (static routes have none). Single-URL entries, no hreflang.
 */
export function buildSitemap(
  staticPaths: readonly string[],
  hotelEntries: SitemapEntry[],
  articles: MagazineArticle[],
  journeyEntries: SitemapEntry[],
): MetadataRoute.Sitemap {
  const dynamic: SitemapEntry[] = [
    ...hotelEntries,
    ...articles.map(magazineArticleSitemapEntry),
    ...journeyEntries,
  ];

  const staticEntries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: absoluteUrl(path),
  }));

  const dynamicEntries: MetadataRoute.Sitemap = dynamic.map((entry) => ({
    url: absoluteUrl(entry.path),
    ...(entry.lastModified ? { lastModified: entry.lastModified } : {}),
  }));

  return [...staticEntries, ...dynamicEntries];
}
