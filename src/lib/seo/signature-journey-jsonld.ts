import type { Lang } from '@/contexts/LanguageContext';
import { getImageUrl, getLocalizedText } from '@/types/common';
import { toFaqItems, type SignatureJourney } from '@/types/signatureJourney';
import { absoluteUrl, serverT } from '@/lib/seo/locale';

/**
 * The Paris Class travel-agency entity. STATIC and site-wide: emitted once in
 * the root layout as the standalone TravelAgency block, and reused as the
 * `provider` of the per-page TouristTrip. `url` is the agency's own site
 * (parisclass.com), independent of the consumer-site publish origin.
 */
export const PARIS_CLASS_AGENCY = {
  '@type': 'TravelAgency',
  name: 'Paris Class',
  url: 'https://parisclass.com',
  iataCode: '17335835',
  memberOf: {
    '@type': 'Organization',
    name: 'Virtuoso',
  },
} as const;

/** The site-wide TravelAgency JSON-LD document (root layout singleton). */
export function buildTravelAgencyJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    ...PARIS_CLASS_AGENCY,
  };
}

/**
 * Split a route's `stops` string into individual destination names. Stops are
 * authored as a single em-dash-joined string (e.g. "Tokyo — Kyoto — Osaka").
 * Returns [] when there is no usable text.
 */
export function splitRouteStops(stops: string): string[] {
  if (!stops) return [];
  return stops
    .split(' — ')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * TouristTrip for the journey. `itinerary` is derived from the FIRST route's
 * stops (split into ordered TouristDestination ListItems); it is omitted
 * entirely when there are no routes or no parseable stops. No `category` /
 * `touristType` (dropped in SJ-1) and no `offers` (no price field exists).
 */
export function buildTouristTripJsonLd(
  journey: SignatureJourney,
  lang: Lang,
  canonicalUrl: string,
): Record<string, unknown> {
  const name = getLocalizedText(journey.title, lang) || journey.slug;
  const description = getLocalizedText(journey.description, lang);
  const coverImage = getImageUrl(journey.cover_image);

  const doc: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name,
    url: canonicalUrl,
    provider: { ...PARIS_CLASS_AGENCY },
  };

  if (description) doc.description = description;
  if (coverImage && !coverImage.startsWith('/')) doc.image = coverImage;

  const firstRoute = journey.routes?.[0];
  if (firstRoute) {
    const stops = splitRouteStops(getLocalizedText(firstRoute.stops, lang));
    if (stops.length > 0) {
      doc.itinerary = {
        '@type': 'ItemList',
        itemListElement: stops.map((stop, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'TouristDestination',
            name: stop,
          },
        })),
      };
    }
  }

  return doc;
}

/** Home → Signature Journeys (section) → this journey. */
export function buildBreadcrumbJsonLd(
  journey: SignatureJourney,
  lang: Lang,
  canonicalUrl: string,
): Record<string, unknown> {
  const name = getLocalizedText(journey.title, lang) || journey.slug;

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: serverT('hotel.breadcrumb_home', lang),
        item: absoluteUrl('/'),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: serverT('signature_journeys.breadcrumb_label', lang),
        item: absoluteUrl('/signature-journeys'),
      },
      {
        '@type': 'ListItem',
        position: 3,
        name,
        item: canonicalUrl,
      },
    ],
  };
}

/**
 * FAQPage — the GEO core. Built from the SAME `toFaqItems(journey.faqs)`
 * normalization the on-screen `<FaqAccordion>` consumes, so the emitted
 * questions/answers are byte-identical to what renders. Returns null when there
 * are no FAQ items (never emit an empty FAQPage).
 */
export function buildFaqPageJsonLd(
  journey: SignatureJourney,
  lang: Lang,
): Record<string, unknown> | null {
  const items = toFaqItems(journey.faqs);
  if (items.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: getLocalizedText(item.question, lang),
      acceptedAnswer: {
        '@type': 'Answer',
        text: getLocalizedText(item.answer, lang),
      },
    })),
  };
}

/**
 * All three per-page JSON-LD documents (TouristTrip, BreadcrumbList, FAQPage).
 * FAQPage is dropped when the journey has no FAQs. TravelAgency is NOT here —
 * it is a site-wide singleton emitted by the root layout.
 */
export function buildSignatureJourneyJsonLd(
  journey: SignatureJourney,
  lang: Lang,
  canonicalUrl: string,
): Record<string, unknown>[] {
  const docs: Record<string, unknown>[] = [
    buildTouristTripJsonLd(journey, lang, canonicalUrl),
    buildBreadcrumbJsonLd(journey, lang, canonicalUrl),
  ];
  const faq = buildFaqPageJsonLd(journey, lang);
  if (faq) docs.push(faq);
  return docs;
}
