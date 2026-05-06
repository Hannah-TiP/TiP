import { getImageUrl, type GeoPoint, type Image, type MultiLanguageString } from '@/types/common';

export type HotelStatus = 'draft' | 'published' | 'archived';
export type HotelStarRating = '1' | '2' | '3' | '4' | '5';

export interface HotelContact {
  phone?: string | null;
  email?: string | null;
  website_url?: string | null;
}

export interface HotelHighlightTag {
  highlight_type: 'tag';
  text: MultiLanguageString;
}

export interface HotelHighlightStat {
  highlight_type: 'stat';
  label: MultiLanguageString;
  value: MultiLanguageString;
}

export type HotelHighlight = HotelHighlightTag | HotelHighlightStat;

export interface HotelRoom {
  name: MultiLanguageString;
  size_sqm?: number | null;
  summary?: MultiLanguageString | null;
  images?: Image[] | null;
}

export interface HotelFeature {
  feature_type: 'facility' | 'amenity';
  name: MultiLanguageString;
  description?: MultiLanguageString | null;
  icon?: string | null;
  images?: Image[] | null;
}

export interface HotelBenefitProgram {
  program_name?: string | null;
  valid_from?: string | null;
  valid_until?: string | null;
  benefits: MultiLanguageString[];
}

export interface FaqItem {
  question: MultiLanguageString;
  answer: MultiLanguageString;
}

export interface HotelPolicy {
  policy_type: 'pet' | 'smoking' | 'child' | 'lounge_child';
  content: MultiLanguageString;
}

export interface HotelExternalLink {
  link_type: 'google_map' | 'official_website';
  url: string;
}

export interface HotelSeo {
  page_title?: MultiLanguageString | null;
  meta_description?: MultiLanguageString | null;
  canonical_url?: string | null;
  og_title?: MultiLanguageString | null;
  og_description?: MultiLanguageString | null;
  og_image?: Image | null;
}

export interface Hotel {
  id: number;
  city_id?: number | null;
  brand_id?: number | null;
  slug: string;
  status: HotelStatus;
  star_rating?: HotelStarRating | null;
  name?: MultiLanguageString | null;
  address?: MultiLanguageString | null;
  geo?: GeoPoint | null;
  overview?: MultiLanguageString | null;
  check_in_time?: string | null;
  check_out_time?: string | null;
  contact?: HotelContact | null;
  external_links?: HotelExternalLink[] | null;
  highlights?: HotelHighlight[] | null;
  images?: Image[] | null;
  rooms?: HotelRoom[] | null;
  features?: HotelFeature[] | null;
  benefits?: HotelBenefitProgram[] | null;
  faqs?: FaqItem[] | null;
  policies?: HotelPolicy[] | null;
  seo?: HotelSeo | null;
  schema_version: number;
  created_at?: string | null;
  updated_at?: string | null;
}

export function getHotelImages(hotel: Hotel): string[] {
  if (!hotel.images || hotel.images.length === 0) {
    return ['/placeholder.jpg'];
  }
  return hotel.images.map((image) => getImageUrl(image));
}

export function getHotelCoordinates(hotel: Hotel): GeoPoint | null {
  return hotel.geo || null;
}

export function getHotelExternalLink(
  hotel: Hotel,
  linkType: HotelExternalLink['link_type'],
): string | null {
  return hotel.external_links?.find((link) => link.link_type === linkType)?.url || null;
}
