import type { Lang } from '@/contexts/LanguageContext';
import { getImageUrl, getLocalizedText } from '@/types/common';
import { getHotelExternalLink, type Hotel } from '@/types/hotel';
import { TYPE_ENUM_TO_SEGMENT } from '@/types/magazine';
import type { MagazineHotelArticleRef } from '@/types/magazine-hotel';
import type { ReviewWithAuthor } from '@/types/review';
import { reviewAuthorDisplayName } from '@/types/review';
import { absoluteUrl, serverT } from '@/lib/seo/locale';

/** Max number of individual Review nodes embedded in the Hotel JSON-LD. */
export const MAX_JSONLD_REVIEWS = 10;

/**
 * `Hotel` — name / url / image / description / address / starRating /
 * amenityFeature / sameAs. Empty keys are omitted. `address` is emitted as
 * schema.org Text (the payload has no structured PostalAddress). `starRating`
 * reflects `star_rating` (e.g. "5"); `amenityFeature` is derived from every
 * `features[]` entry; `sameAs` collects the official website + contact URL.
 */
export function buildHotelJsonLd(
  hotel: Hotel,
  lang: Lang,
  canonicalUrl: string,
): Record<string, unknown> {
  const name = getLocalizedText(hotel.name, lang) || hotel.slug;
  const description = getLocalizedText(hotel.overview, lang);
  const address = getLocalizedText(hotel.address, lang);

  const doc: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Hotel',
    name,
    url: canonicalUrl,
  };

  if (hotel.images && hotel.images.length > 0) {
    doc.image = hotel.images.map((image) => getImageUrl(image));
  }
  if (description) doc.description = description;
  if (address) doc.address = address;

  if (hotel.star_rating) {
    doc.starRating = {
      '@type': 'Rating',
      ratingValue: hotel.star_rating,
    };
  }

  const amenities = (hotel.features ?? [])
    .map((feature) => getLocalizedText(feature.name, lang))
    .filter((value) => value.length > 0)
    .map((value) => ({
      '@type': 'LocationFeatureSpecification',
      name: value,
    }));
  if (amenities.length > 0) doc.amenityFeature = amenities;

  const officialWebsite = getHotelExternalLink(hotel, 'official_website');
  const contactWebsite = hotel.contact?.website_url ?? null;
  const sameAs = [officialWebsite, contactWebsite].filter(
    (url): url is string => typeof url === 'string' && url.length > 0,
  );
  if (sameAs.length > 0) doc.sameAs = Array.from(new Set(sameAs));

  return doc;
}

/**
 * `FAQPage` — built from the SAME `getLocalizedText` derivation the on-screen
 * `<FaqAccordion>` uses (parity by construction; unit-tested), so the emitted
 * questions/answers match whatever the component renders. Returns `null` when
 * there are no answerable FAQ items (never emit an empty FAQPage).
 */
export function buildHotelFaqJsonLd(hotel: Hotel, lang: Lang): Record<string, unknown> | null {
  const faqs = hotel.faqs ?? [];
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
}

/**
 * `AggregateRating` + up to {@link MAX_JSONLD_REVIEWS} `Review` nodes for the
 * hotel. Returns `null` (the ENTIRE review block is omitted) when `reviewCount`
 * is 0 — schema.org forbids an AggregateRating without reviews.
 */
export function buildHotelReviewJsonLd(
  hotel: Hotel,
  lang: Lang,
  canonicalUrl: string,
  averageRating: number | null,
  reviewCount: number,
  reviews: ReviewWithAuthor[],
): Record<string, unknown> | null {
  if (reviewCount <= 0) return null;

  const name = getLocalizedText(hotel.name, lang) || hotel.slug;

  const doc: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Hotel',
    name,
    url: canonicalUrl,
  };

  if (averageRating !== null) {
    doc.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: averageRating,
      reviewCount,
    };
  }

  const reviewNodes = reviews.slice(0, MAX_JSONLD_REVIEWS).map((entry) => {
    const node: Record<string, unknown> = {
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: reviewAuthorDisplayName(entry.author),
      },
      reviewRating: {
        '@type': 'Rating',
        ratingValue: entry.review.rating,
      },
    };
    if (entry.review.comment) node.reviewBody = entry.review.comment;
    if (entry.review.created_at) node.datePublished = entry.review.created_at;
    return node;
  });
  if (reviewNodes.length > 0) doc.review = reviewNodes;

  return doc;
}

/**
 * `BreadcrumbList` — Home → Hotels (/dream-hotels) → [country pillar] → hotel.
 * The country-pillar crumb is emitted ONLY when a pillar article is resolvable
 * from the bridge. JSON-LD only — there is no visible breadcrumb UI change.
 */
export function buildHotelBreadcrumbJsonLd(
  hotel: Hotel,
  lang: Lang,
  canonicalUrl: string,
  countryPillar: MagazineHotelArticleRef | null,
): Record<string, unknown> {
  const name = getLocalizedText(hotel.name, lang) || hotel.slug;

  const itemListElement: Record<string, unknown>[] = [
    {
      '@type': 'ListItem',
      position: 1,
      name: serverT('hotel.breadcrumb_home', lang),
      item: absoluteUrl('/'),
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: serverT('hotel.breadcrumb_dream_hotels', lang),
      item: absoluteUrl('/dream-hotels'),
    },
  ];

  if (countryPillar) {
    const pillarName = getLocalizedText(countryPillar.title, lang);
    if (pillarName) {
      itemListElement.push({
        '@type': 'ListItem',
        position: itemListElement.length + 1,
        name: pillarName,
        item: absoluteUrl(
          `/magazine/${TYPE_ENUM_TO_SEGMENT[countryPillar.type]}/${countryPillar.slug}`,
        ),
      });
    }
  }

  itemListElement.push({
    '@type': 'ListItem',
    position: itemListElement.length + 1,
    name,
    item: canonicalUrl,
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement,
  };
}

interface HotelJsonLdInput {
  hotel: Hotel;
  lang: Lang;
  canonicalUrl: string;
  averageRating: number | null;
  reviewCount: number;
  reviews: ReviewWithAuthor[];
  countryPillar: MagazineHotelArticleRef | null;
}

/**
 * All per-page hotel JSON-LD documents (Hotel, FAQPage, AggregateRating+Review,
 * BreadcrumbList). FAQPage is dropped when there are no FAQs; the review block
 * is dropped when there are no reviews. `TravelAgency` is NOT emitted here — it
 * is a site-wide singleton in the root layout.
 */
export function buildHotelJsonLdStack(input: HotelJsonLdInput): Record<string, unknown>[] {
  const { hotel, lang, canonicalUrl, averageRating, reviewCount, reviews, countryPillar } = input;

  const docs: Record<string, unknown>[] = [buildHotelJsonLd(hotel, lang, canonicalUrl)];

  const faq = buildHotelFaqJsonLd(hotel, lang);
  if (faq) docs.push(faq);

  const reviewBlock = buildHotelReviewJsonLd(
    hotel,
    lang,
    canonicalUrl,
    averageRating,
    reviewCount,
    reviews,
  );
  if (reviewBlock) docs.push(reviewBlock);

  docs.push(buildHotelBreadcrumbJsonLd(hotel, lang, canonicalUrl, countryPillar));

  return docs;
}
