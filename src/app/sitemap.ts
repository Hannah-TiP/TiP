import type { MetadataRoute } from 'next';
import { buildSitemap, STATIC_SITEMAP_PATHS } from '@/lib/seo/sitemap-builder';
import {
  fetchHotelSitemapEntries,
  fetchMagazineArticleRows,
  fetchSignatureJourneySitemapEntries,
} from '@/lib/seo/sitemap-fetch';

/** Revalidate at most hourly — the sitemap is content-derived, not per-request. */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [hotelEntries, articles, journeyEntries] = await Promise.all([
    fetchHotelSitemapEntries(),
    fetchMagazineArticleRows(),
    fetchSignatureJourneySitemapEntries(),
  ]);

  return buildSitemap(STATIC_SITEMAP_PATHS, hotelEntries, articles, journeyEntries);
}
