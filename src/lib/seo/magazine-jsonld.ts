import type { Lang } from '@/contexts/LanguageContext';
import { getImageUrl, getLocalizedText } from '@/types/common';
import type { MagazineArticleDetail, MagazineArticleType } from '@/types/magazine';
import { TYPE_ENUM_TO_SEGMENT } from '@/types/magazine';
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
  destination: BASE_BUILDERS,
  collection: BASE_BUILDERS,
  guide: BASE_BUILDERS,
  news: BASE_BUILDERS,
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
