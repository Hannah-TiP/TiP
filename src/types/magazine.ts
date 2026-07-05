import type { Image, MultiLanguageString } from '@/types/common';

/**
 * TiP consumer types for the Magazine content system.
 *
 * These mirror the MAG-1 backend Pydantic response models
 * (`tip-backend/v2/data_model/schemas/magazine_article.py`) with IDENTICAL
 * names. Do NOT invent composite / projection names for these shapes.
 */

/** Singular type enum — matches the backend `MagazineArticleType`. */
export type MagazineArticleType = 'destination' | 'collection' | 'guide' | 'news' | 'insider';

/** Publish status — matches the backend `MagazineArticleStatus`. */
export type MagazineArticleStatus = 'draft' | 'scheduled' | 'published';

export type ArticleRelationTargetType = 'hotel' | 'article';

export type ArticleRelationKind = 'linked' | 'related' | 'ranked' | 'parent';

/** News category — matches the backend `NewsCategory`. */
export type NewsCategory = 'opening' | 'brand_news' | 'award' | 'michelin';

/** Insider topic — matches the backend `InsiderTopic`. */
export type InsiderTopic = 'virtuoso' | 'booking' | 'upgrade' | 'membership' | 'behind_the_scenes';

/**
 * One step of a Guide article's itinerary / how-to. Mirrors the backend
 * `GuideStep`. `body` is rich text (rendered as-is on screen; serialized to
 * plain text for the HowTo JSON-LD). `hotel_id` optionally ties the step to a
 * hotel (that hotel is also synced into a `kind=linked` relation server-side,
 * so its render-ready card is available via `linkedHotelRelations`).
 */
export interface GuideStep {
  label?: string | null;
  title?: MultiLanguageString | null;
  body?: MultiLanguageString | null;
  hotel_id?: number | null;
}

/** Typed `type_payload` for a Guide article. Mirrors the backend `GuidePayload`. */
export interface GuidePayload {
  steps: GuideStep[];
}

/** Typed `type_payload` for a News article. Mirrors the backend `NewsPayload`. */
export interface NewsPayload {
  category?: NewsCategory | null;
}

/** Typed `type_payload` for an Insider article. Mirrors the backend `InsiderPayload`. */
export interface InsiderPayload {
  topic?: InsiderTopic | null;
}

/** A short TL;DR fact (GEO extraction target). 3-5 per article. */
export interface KeyTakeaway {
  text?: MultiLanguageString | null;
}

/** FAQ repeater item (screen FAQ + FAQPage JSON-LD). */
export interface Faq {
  question?: MultiLanguageString | null;
  answer?: MultiLanguageString | null;
}

/** SEO overrides. Empty fields fall back to title / summary / hero_image. */
export interface Seo {
  meta_title?: MultiLanguageString | null;
  meta_description?: MultiLanguageString | null;
  og_image?: Image | null;
}

/**
 * A single modular body block. `type` is one of the spec block types
 * (rich_text / section / image / gallery / comparison_table / quote / callout /
 * cta / related). The consumer renderer handles a minimal known subset; unknown
 * block types render nothing (forward-compat).
 */
export interface BodyBlock {
  type: string;
  text?: MultiLanguageString | null;
  heading?: MultiLanguageString | null;
  image?: Image | null;
  images?: Image[] | null;
}

/** Flat magazine article read schema (base row, no expansions). */
export interface MagazineArticle {
  id: number;
  type: MagazineArticleType;
  slug: string;
  status: MagazineArticleStatus;
  published_at?: string | null;
  country_id?: number | null;
  city_id?: number | null;
  brand_id?: number | null;
  title?: MultiLanguageString | null;
  summary?: MultiLanguageString | null;
  hero_image?: Image | null;
  hero_alt?: MultiLanguageString | null;
  key_takeaways?: KeyTakeaway[] | null;
  body?: BodyBlock[] | null;
  faqs?: Faq[] | null;
  seo?: Seo | null;
  type_payload?: Record<string, unknown> | null;
  tags: MultiLanguageString[];
  schema_version: number;
  created_at?: string | null;
  updated_at?: string | null;
}

/** A relation edge (article → hotel / article). */
export interface ArticleRelation {
  id?: number | null;
  article_id?: number | null;
  target_type: ArticleRelationTargetType;
  target_id: number;
  kind: ArticleRelationKind;
  position: number;
  blurb?: MultiLanguageString | null;
  schema_version: number;
  created_at?: string | null;
  updated_at?: string | null;
}

/**
 * Render-ready summary of a hotel a relation points at. Narrow projection of
 * the heavyweight `Hotel` schema — only the fields the FE needs to render a
 * relation card. `hero_image` is the hotel's first catalog image (`null` when
 * the hotel has no images).
 */
export interface MagazineRelationHotelRef {
  id: number;
  slug: string;
  name?: MultiLanguageString | null;
  hero_image?: Image | null;
}

/**
 * Render-ready summary of an article a relation (or auto-related edge) points
 * at. The shape shared by expanded article-target relations and every entry in
 * `related[]`.
 */
export interface MagazineRelationArticleRef {
  id: number;
  type: MagazineArticleType;
  slug: string;
  title?: MultiLanguageString | null;
  hero_image?: Image | null;
}

/**
 * An `ArticleRelation` whose `target_id` has been resolved. Exactly one of
 * `hotel` / `article` is populated, matching `target_type`
 * (ranked/linked → hotel; related/parent → article).
 */
export interface ExpandedArticleRelation extends ArticleRelation {
  hotel?: MagazineRelationHotelRef | null;
  article?: MagazineRelationArticleRef | null;
}

/** Complete `seo_render` input payload returned by the detail API. */
export interface MagazineArticleDetail {
  article: MagazineArticle;
  relations: ExpandedArticleRelation[];
  related: MagazineRelationArticleRef[];
  available_locales: string[];
}

/**
 * Plural URL segment → singular backend enum. SINGLE source of truth used for
 * BOTH `notFound()` validation and the API call. Any segment not present here
 * is rejected (⇒ `notFound()`). Note `news` and `insider` are identical either
 * side.
 */
export const TYPE_SEGMENT_TO_ENUM: Record<string, MagazineArticleType> = {
  destinations: 'destination',
  collections: 'collection',
  guides: 'guide',
  news: 'news',
  insider: 'insider',
};

/** Singular enum → plural URL segment (canonical URL construction). */
export const TYPE_ENUM_TO_SEGMENT: Record<MagazineArticleType, string> = {
  destination: 'destinations',
  collection: 'collections',
  guide: 'guides',
  news: 'news',
  insider: 'insider',
};

/**
 * Resolve a plural URL segment to its singular type enum, or `null` when the
 * segment is unknown. Callers treat `null` as a 404 signal.
 */
export function typeEnumFromSegment(segment: string): MagazineArticleType | null {
  return TYPE_SEGMENT_TO_ENUM[segment] ?? null;
}
