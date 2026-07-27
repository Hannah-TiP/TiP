import type { PaginatedData } from '@/types/common';
import type { Hotel } from '@/types/hotel';
import type { MagazineArticle } from '@/types/magazine';
import type { SignatureJourney } from '@/types/signatureJourney';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

/** A single sitemap entry: an absolute-path route + optional lastModified. */
export interface SitemapEntry {
  path: string;
  lastModified?: string;
}

/**
 * Drain every page of a paginated backend list endpoint. Loops from page 1,
 * following `has_more`, and returns the flattened items. A hard page ceiling
 * guards against a runaway loop if the backend ever misreports `has_more`.
 */
async function drainPaginated<T>(buildUrl: (page: number) => string): Promise<T[]> {
  const items: T[] = [];
  const MAX_PAGES = 1000;
  for (let page = 1; page <= MAX_PAGES; page++) {
    const response = await fetch(buildUrl(page), {
      headers: { 'Content-Type': 'application/json', Language: 'en' },
    });
    if (!response.ok) break;
    const payload = (await response.json()) as { data?: PaginatedData<T> };
    const data = payload.data;
    if (!data) break;
    items.push(...data.items);
    if (!data.has_more || data.items.length === 0) break;
  }
  return items;
}

/**
 * All published hotels as `/hotel/{slug}` sitemap entries with
 * `lastModified = updated_at`. Paginated at the backend's 50/page cap.
 */
export async function fetchHotelSitemapEntries(): Promise<SitemapEntry[]> {
  try {
    const hotels = await drainPaginated<Hotel>(
      (page) => `${API_BASE_URL}/api/v2/hotels?page=${page}&per_page=50`,
    );
    return hotels
      .filter((hotel) => hotel.slug)
      .map((hotel) => ({
        path: `/hotel/${hotel.slug}`,
        lastModified: hotel.updated_at ?? undefined,
      }));
  } catch (error) {
    console.error('Hotel sitemap fetch failed:', error);
    return [];
  }
}

/**
 * All published magazine articles as `/magazine/{typeSegment}/{slug}` entries
 * with `lastModified = updated_at`. Paginated at the article endpoint's 100/page
 * cap. The plural segment mapping is applied by the caller.
 */
export async function fetchMagazineArticleRows(): Promise<MagazineArticle[]> {
  try {
    return await drainPaginated<MagazineArticle>(
      (page) => `${API_BASE_URL}/api/v2/magazine/articles?page=${page}&per_page=100`,
    );
  } catch (error) {
    console.error('Magazine sitemap fetch failed:', error);
    return [];
  }
}

/**
 * All published Destination pillar articles (`type=destination`), drained
 * across pages. Used by `/llms.txt` to list the destination guides.
 */
export async function fetchDestinationArticles(): Promise<MagazineArticle[]> {
  try {
    return await drainPaginated<MagazineArticle>(
      (page) =>
        `${API_BASE_URL}/api/v2/magazine/articles?type=destination&page=${page}&per_page=100`,
    );
  } catch (error) {
    console.error('Destination articles fetch failed:', error);
    return [];
  }
}

/**
 * All published signature journeys as `/signature-journeys/{slug}` entries. The
 * list endpoint is published-only. No lastModified is emitted (the SJ list
 * response is the canonical source of the slug set).
 */
export async function fetchSignatureJourneySitemapEntries(): Promise<SitemapEntry[]> {
  try {
    const journeys = await drainPaginated<SignatureJourney>(
      (page) => `${API_BASE_URL}/api/v2/signature-journeys?page=${page}&per_page=100`,
    );
    return journeys
      .filter((journey) => journey.slug)
      .map((journey) => ({
        path: `/signature-journeys/${journey.slug}`,
        lastModified: journey.updated_at ?? undefined,
      }));
  } catch (error) {
    console.error('Signature journey sitemap fetch failed:', error);
    return [];
  }
}
