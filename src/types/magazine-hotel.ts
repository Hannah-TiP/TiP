import type { Image, MultiLanguageString } from '@/types/common';
import type { MagazineArticleType } from '@/types/magazine';

/**
 * Render-ready summary of a magazine article linked to a hotel. Mirrors the
 * backend `MagazineHotelArticleRef` — the narrow projection returned by the
 * hotel→magazine bridge endpoint (only the fields a backlink card needs).
 */
export interface MagazineHotelArticleRef {
  id: number;
  type: MagazineArticleType;
  slug: string;
  title?: MultiLanguageString | null;
  hero_image?: Image | null;
}

/**
 * Response of `GET /api/v2/magazine/hotels/{hotel_id}/articles`. Mirrors the
 * backend `MagazineHotelArticles` Pydantic model.
 *
 * `featured` are the published linked/ranked articles that reference the hotel
 * (newest first, ≤6). `country_pillar` is the latest published Destination
 * article for the hotel's country, or `null` when none exists — used ONLY for
 * the BreadcrumbList JSON-LD crumb.
 */
export interface MagazineHotelArticles {
  featured: MagazineHotelArticleRef[];
  country_pillar: MagazineHotelArticleRef | null;
}
