import type { Lang } from '@/contexts/LanguageContext';
import { getImageUrl, getLocalizedText } from '@/types/common';
import type {
  ExpandedArticleRelation,
  MagazineArticleDetail,
  MagazineArticleType,
} from '@/types/magazine';
import { TYPE_ENUM_TO_SEGMENT } from '@/types/magazine';
import { linkedHotelRelations, rankedHotelRelations } from '@/lib/magazine-relations';
import { guideSteps } from '@/lib/magazine-payload';
import { toPlainText } from '@/lib/magazine-plain-text';
import { SITE_ORIGIN } from '@/lib/seo/locale';

/**
 * JSON-LD builders + a TYPE-KEYED DISPATCH TABLE for the Magazine SEO stack.
 *
 * Each builder takes the server-fetched detail payload + the resolved UI
 * language and returns a plain, JSON-serializable object (or `null` when there
 * is nothing to emit — e.g. no FAQs). The page component `JSON.stringify`s these
 * (injection-safe: content is never string-concatenated into the script).
 *
 * The dispatch table is designed for extension: MAG-3 will register an
 * `ItemList` builder for destination/collection, MAG-4 a `HowTo`/`NewsArticle`
 * builder for guide/news. For now every published type gets the SAME base
 * stack (Article + FAQPage + BreadcrumbList).
 */

export type JsonLd = Record<string, unknown>;

export type JsonLdBuilder = (detail: MagazineArticleDetail, lang: Lang) => JsonLd | null;

const PUBLISHER = {
  '@type': 'Organization',
  name: 'Travel in Your Pocket',
};

/** Canonical `/magazine/{typeSegment}/{slug}` absolute URL for the article. */
export function articleCanonicalUrl(type: MagazineArticleType, slug: string): string {
  return `${SITE_ORIGIN}/magazine/${TYPE_ENUM_TO_SEGMENT[type]}/${slug}`;
}

/**
 * Absolute hotel detail URL on the SAME canonical host as
 * {@link articleCanonicalUrl}. The path is `/hotel/{slug}` (D1 Model A — the
 * TiP consumer route), NOT the spec's `/hotels/{slug}`.
 */
export function hotelCanonicalUrl(slug: string): string {
  return `${SITE_ORIGIN}/hotel/${slug}`;
}

/** `Article` — headline/description/image/dates/publisher. Omits empty keys. */
export const buildArticleJsonLd: JsonLdBuilder = (detail, lang) => {
  const { article } = detail;
  const headline = getLocalizedText(article.title, lang);

  const node: JsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    url: articleCanonicalUrl(article.type, article.slug),
    publisher: PUBLISHER,
  };

  const description = getLocalizedText(article.summary, lang);
  if (description) node.description = description;

  if (article.hero_image) node.image = getImageUrl(article.hero_image);
  if (article.published_at) node.datePublished = article.published_at;
  if (article.updated_at) node.dateModified = article.updated_at;

  return node;
};

/**
 * `FAQPage` — built from the SAME server-fetched `article.faqs` payload the
 * on-screen FAQ accordion renders (parity is asserted in the unit test).
 * Returns `null` when there are no answerable FAQs so no empty stack is emitted.
 */
export const buildFaqPageJsonLd: JsonLdBuilder = (detail, lang) => {
  const faqs = detail.article.faqs ?? [];
  const mainEntity = faqs
    .map((faq) => {
      const question = getLocalizedText(faq.question, lang);
      const answer = getLocalizedText(faq.answer, lang);
      if (!question || !answer) return null;
      return {
        '@type': 'Question',
        name: question,
        acceptedAnswer: { '@type': 'Answer', text: answer },
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (mainEntity.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity,
  };
};

/**
 * `BreadcrumbList` — BAKED hierarchy: Home → Magazine (/magazine) → {title}.
 * The middle crumb targets `/magazine` (index route lands later; structured
 * data only). No per-type listing URLs.
 */
export const buildBreadcrumbJsonLd: JsonLdBuilder = (detail, lang) => {
  const { article } = detail;
  const title = getLocalizedText(article.title, lang) || article.slug;

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_ORIGIN,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Magazine',
        item: `${SITE_ORIGIN}/magazine`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: title,
      },
    ],
  };
};

/**
 * `ItemList` — the ranked hotels (Destination pillars) as an ordered list of
 * hotel `ListItem`s. Built from the SAME `rankedHotelRelations(...)` selector
 * the on-screen ranked section consumes, so the JSON-LD order/content EQUALS
 * the rendered order (parity is asserted in the unit test). Each element uses an
 * ABSOLUTE `/hotel/{slug}` URL on the canonical host, `position` = the 1-based
 * array index (the on-screen rank badge, NOT the raw stored `relation.position`
 * — those diverge when positions are non-contiguous, e.g. a deleted rank), and
 * `name` = the hotel's EN name from the MLS. Returns `null` when there are no
 * ranked hotels so no empty node is emitted.
 */
export const buildItemListJsonLd: JsonLdBuilder = (detail) => {
  const ranked = rankedHotelRelations(detail.relations);
  if (ranked.length === 0) return null;

  const itemListElement = ranked.map((relation: ExpandedArticleRelation, index) => {
    const hotel = relation.hotel!;
    const name = getLocalizedText(hotel.name, 'en');
    const element: JsonLd = {
      '@type': 'ListItem',
      position: index + 1,
      url: hotelCanonicalUrl(hotel.slug),
    };
    if (name) element.name = name;
    return element;
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement,
  };
};

/**
 * `HowTo` (Guide) — built from the SAME `guideSteps(...)` payload the on-screen
 * Guide steps section renders (parity is asserted in the unit test). Each
 * `HowToStep` carries `position` (1-based index), `name` (the step title, or the
 * label as a fallback) and `text` (the step body serialized to PLAIN text — the
 * page renders the rich version). A step's `url` is emitted ONLY when the step is
 * tied to a hotel whose linked-relation ref resolves a slug (empty-key omission).
 * Returns `null` when there are no steps so no empty node is emitted.
 */
export const buildHowToJsonLd: JsonLdBuilder = (detail, lang) => {
  const steps = guideSteps(detail.article);
  if (steps.length === 0) return null;

  // Resolve step hotels → slug via the same linked relations the page renders.
  const slugByHotelId = new Map<number, string>();
  for (const relation of linkedHotelRelations(detail.relations)) {
    if (relation.hotel) slugByHotelId.set(relation.hotel.id, relation.hotel.slug);
  }

  const step = steps.map((guideStep, index) => {
    const name = getLocalizedText(guideStep.title, lang) || guideStep.label || '';
    const text = toPlainText(getLocalizedText(guideStep.body, lang));
    const element: JsonLd = {
      '@type': 'HowToStep',
      position: index + 1,
    };
    if (name) element.name = name;
    if (text) element.text = text;
    const slug = guideStep.hotel_id != null ? slugByHotelId.get(guideStep.hotel_id) : undefined;
    if (slug) element.url = hotelCanonicalUrl(slug);
    return element;
  });

  const node: JsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    step,
  };
  const name = getLocalizedText(detail.article.title, lang);
  if (name) node.name = name;
  return node;
};

/**
 * `NewsArticle` — the News-type replacement for `buildArticleJsonLd` (same
 * shape, `@type` = `NewsArticle`). `datePublished` is the GEO freshness signal
 * and is emitted whenever present. Omits empty keys.
 */
export const buildNewsArticleJsonLd: JsonLdBuilder = (detail, lang) => {
  const article = buildArticleJsonLd(detail, lang)!;
  return { ...article, '@type': 'NewsArticle' };
};

/** The base stack every published type gets today. */
const BASE_BUILDERS: JsonLdBuilder[] = [
  buildArticleJsonLd,
  buildFaqPageJsonLd,
  buildBreadcrumbJsonLd,
];

/**
 * TYPE-KEYED DISPATCH TABLE. Every published type currently resolves to the
 * base builders; future issues register extra builders per type (e.g.
 * destination/collection → ItemList, guide → HowTo, news → NewsArticle) by
 * adding entries here.
 */
export const JSONLD_BUILDERS: Record<MagazineArticleType, JsonLdBuilder[]> = {
  // Destination + Collection: Article + FAQPage + BreadcrumbList + ItemList
  // (both reuse the ranked-hotel ItemList; empty when no ranked hotels).
  destination: [...BASE_BUILDERS, buildItemListJsonLd],
  collection: [...BASE_BUILDERS, buildItemListJsonLd],
  // Guide: Article + FAQPage + BreadcrumbList + HowTo.
  guide: [...BASE_BUILDERS, buildHowToJsonLd],
  // News: NewsArticle REPLACES Article; keeps FAQPage + BreadcrumbList.
  news: [buildNewsArticleJsonLd, buildFaqPageJsonLd, buildBreadcrumbJsonLd],
  // Insider: plain Article + FAQPage + BreadcrumbList (NO author node).
  insider: BASE_BUILDERS,
};

/**
 * Resolve every JSON-LD node for a published article, dropping builders that
 * returned `null`. This is what the server component serializes into
 * `<script type="application/ld+json">` blocks in the initial HTML.
 */
export function buildMagazineJsonLd(detail: MagazineArticleDetail, lang: Lang): JsonLd[] {
  const builders = JSONLD_BUILDERS[detail.article.type] ?? BASE_BUILDERS;
  return builders
    .map((build) => build(detail, lang))
    .filter((node): node is JsonLd => node !== null);
}
