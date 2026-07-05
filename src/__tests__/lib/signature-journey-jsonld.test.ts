import { describe, expect, it } from 'vitest';
import type { SignatureJourney } from '@/types/signatureJourney';
import { toFaqItems } from '@/types/signatureJourney';
import { getLocalizedText } from '@/types/common';
import {
  buildBreadcrumbJsonLd,
  buildFaqPageJsonLd,
  buildSignatureJourneyJsonLd,
  buildTouristTripJsonLd,
  buildTravelAgencyJsonLd,
  splitRouteStops,
} from '@/lib/seo/signature-journey-jsonld';
import { buildSignatureJourneyMetadata } from '@/lib/seo/signature-journey-metadata';

const CANONICAL = 'https://www.travelinyourpocket.com/signature-journeys/aegean-odyssey';

function makeJourney(overrides: Partial<SignatureJourney> = {}): SignatureJourney {
  return {
    id: 1,
    slug: 'aegean-odyssey',
    status: 'published',
    schema_version: 1,
    title: { en: 'Aegean Odyssey', kr: '에게해 오디세이' },
    description: { en: 'A private yacht voyage.', kr: '프라이빗 요트 항해.' },
    cover_image: { original: 'sj/cover.jpg', w1200: 'https://cdn.example.com/cover-1200.jpg' },
    routes: [
      {
        region: { en: 'Greece', kr: '그리스' },
        title: { en: 'Classic Cyclades', kr: '클래식 키클라데스' },
        stops: { en: 'Athens — Mykonos — Santorini', kr: '아테네 — 미코노스 — 산토리니' },
      },
    ],
    specs: [{ key: { en: 'Duration' }, value: { en: '7 nights' } }],
    faqs: [
      {
        question: { en: 'Is it private?', kr: '프라이빗인가요?' },
        answer: { en: 'Yes.', kr: '네.' },
      },
      {
        question: { en: 'How many guests?', kr: '몇 명인가요?' },
        answer: { en: 'Up to 12.', kr: '최대 12명.' },
      },
    ],
    ...overrides,
  };
}

describe('splitRouteStops', () => {
  it('splits an em-dash-joined stops string and trims', () => {
    expect(splitRouteStops('Athens — Mykonos — Santorini')).toEqual([
      'Athens',
      'Mykonos',
      'Santorini',
    ]);
  });

  it('returns [] for an empty string', () => {
    expect(splitRouteStops('')).toEqual([]);
  });

  it('drops empty segments', () => {
    expect(splitRouteStops('Athens —  — Santorini')).toEqual(['Athens', 'Santorini']);
  });
});

describe('buildTravelAgencyJsonLd', () => {
  it('emits the Paris Class agency with IATA + Virtuoso membership', () => {
    const doc = buildTravelAgencyJsonLd();
    expect(doc['@type']).toBe('TravelAgency');
    expect(doc.name).toBe('Paris Class');
    expect(doc.url).toBe('https://parisclass.com');
    expect(doc.iataCode).toBe('17335835');
    expect(doc.memberOf).toMatchObject({ name: 'Virtuoso' });
  });
});

describe('buildTouristTripJsonLd', () => {
  it('binds title/description/cover-image and derives itinerary from the first route stops (EN)', () => {
    const doc = buildTouristTripJsonLd(makeJourney(), 'en', CANONICAL);
    expect(doc['@type']).toBe('TouristTrip');
    expect(doc.name).toBe('Aegean Odyssey');
    expect(doc.description).toBe('A private yacht voyage.');
    expect(doc.url).toBe(CANONICAL);
    expect(doc.image).toBe('https://cdn.example.com/cover-1200.jpg');
    expect(doc.provider).toMatchObject({ '@type': 'TravelAgency', name: 'Paris Class' });

    const itinerary = doc.itinerary as {
      itemListElement: { position: number; item: { name: string } }[];
    };
    expect(itinerary.itemListElement.map((el) => el.item.name)).toEqual([
      'Athens',
      'Mykonos',
      'Santorini',
    ]);
    expect(itinerary.itemListElement[0].position).toBe(1);
  });

  it('selects KR strings on KR locale', () => {
    const doc = buildTouristTripJsonLd(makeJourney(), 'kr', CANONICAL);
    expect(doc.name).toBe('에게해 오디세이');
    const itinerary = doc.itinerary as { itemListElement: { item: { name: string } }[] };
    expect(itinerary.itemListElement.map((el) => el.item.name)).toEqual([
      '아테네',
      '미코노스',
      '산토리니',
    ]);
  });

  it('omits itinerary when there are no routes', () => {
    const doc = buildTouristTripJsonLd(makeJourney({ routes: [] }), 'en', CANONICAL);
    expect(doc.itinerary).toBeUndefined();
  });

  it('omits itinerary when the first route has no stops text', () => {
    const doc = buildTouristTripJsonLd(
      makeJourney({ routes: [{ region: { en: 'Greece' } }] }),
      'en',
      CANONICAL,
    );
    expect(doc.itinerary).toBeUndefined();
  });

  it('has no category, touristType, or offers (dropped in SJ-1)', () => {
    const doc = buildTouristTripJsonLd(makeJourney(), 'en', CANONICAL);
    expect(doc.category).toBeUndefined();
    expect(doc.touristType).toBeUndefined();
    expect(doc.offers).toBeUndefined();
  });
});

describe('buildBreadcrumbJsonLd', () => {
  it('emits Home → Signature Journeys → title with absolute item URLs (EN)', () => {
    const doc = buildBreadcrumbJsonLd(makeJourney(), 'en', CANONICAL);
    const els = doc.itemListElement as { position: number; name: string; item: string }[];
    expect(els.map((e) => e.name)).toEqual(['Home', 'Signature Journeys', 'Aegean Odyssey']);
    expect(els[0].item).toBe('https://www.travelinyourpocket.com/');
    expect(els[1].item).toBe('https://www.travelinyourpocket.com/signature-journeys');
    expect(els[2].item).toBe(CANONICAL);
  });

  it('uses the KR section label on KR locale', () => {
    const doc = buildBreadcrumbJsonLd(makeJourney(), 'kr', CANONICAL);
    const els = doc.itemListElement as { name: string }[];
    expect(els[1].name).toBe('시그니처 여정');
    expect(els[2].name).toBe('에게해 오디세이');
  });
});

describe('buildFaqPageJsonLd', () => {
  it('emits a Question/Answer per FAQ (EN)', () => {
    const doc = buildFaqPageJsonLd(makeJourney(), 'en');
    expect(doc).not.toBeNull();
    const entities = doc!.mainEntity as { name: string; acceptedAnswer: { text: string } }[];
    expect(entities.map((e) => e.name)).toEqual(['Is it private?', 'How many guests?']);
    expect(entities[0].acceptedAnswer.text).toBe('Yes.');
  });

  it('returns null when there are no FAQs', () => {
    expect(buildFaqPageJsonLd(makeJourney({ faqs: [] }), 'en')).toBeNull();
    expect(buildFaqPageJsonLd(makeJourney({ faqs: null }), 'en')).toBeNull();
  });
});

describe('buildSignatureJourneyJsonLd — parity with rendered content', () => {
  it('FAQPage entries === the entries <FaqAccordion> renders via toFaqItems (EN)', () => {
    const journey = makeJourney();
    const docs = buildSignatureJourneyJsonLd(journey, 'en', CANONICAL);
    const faqDoc = docs.find((d) => d['@type'] === 'FAQPage')!;
    const jsonLdEntries = (
      faqDoc.mainEntity as { name: string; acceptedAnswer: { text: string } }[]
    ).map((e) => ({ q: e.name, a: e.acceptedAnswer.text }));

    // Exactly what SignatureJourneyDetailContent feeds <FaqAccordion>.
    const rendered = toFaqItems(journey.faqs).map((item) => ({
      q: getLocalizedText(item.question, 'en'),
      a: getLocalizedText(item.answer, 'en'),
    }));

    expect(jsonLdEntries).toEqual(rendered);
  });

  it('FAQ parity holds on KR locale too', () => {
    const journey = makeJourney();
    const docs = buildSignatureJourneyJsonLd(journey, 'kr', CANONICAL);
    const faqDoc = docs.find((d) => d['@type'] === 'FAQPage')!;
    const jsonLdEntries = (
      faqDoc.mainEntity as { name: string; acceptedAnswer: { text: string } }[]
    ).map((e) => ({ q: e.name, a: e.acceptedAnswer.text }));
    const rendered = toFaqItems(journey.faqs).map((item) => ({
      q: getLocalizedText(item.question, 'kr'),
      a: getLocalizedText(item.answer, 'kr'),
    }));
    expect(jsonLdEntries).toEqual(rendered);
  });

  it('itinerary stops === the same routes[0].stops the page renders (spec/route parity)', () => {
    const journey = makeJourney();
    const docs = buildSignatureJourneyJsonLd(journey, 'en', CANONICAL);
    const trip = docs.find((d) => d['@type'] === 'TouristTrip')!;
    const itinerary = trip.itinerary as { itemListElement: { item: { name: string } }[] };
    const jsonLdStops = itinerary.itemListElement.map((el) => el.item.name);

    // Same binding JourneyRoutes uses: getLocalizedText(route.stops) split on " — ".
    const renderedStops = getLocalizedText(journey.routes![0].stops, 'en')
      .split(' — ')
      .map((s) => s.trim());
    expect(jsonLdStops).toEqual(renderedStops);
  });

  it('drops FAQPage from the per-page set when there are no FAQs; TravelAgency is never included', () => {
    const docs = buildSignatureJourneyJsonLd(makeJourney({ faqs: [] }), 'en', CANONICAL);
    const types = docs.map((d) => d['@type']);
    expect(types).toEqual(['TouristTrip', 'BreadcrumbList']);
    expect(types).not.toContain('FAQPage');
    expect(types).not.toContain('TravelAgency');
  });
});

describe('buildSignatureJourneyMetadata — fallbacks + locale', () => {
  it('prefers meta_title/meta_description/og_image when present', () => {
    const journey = makeJourney({
      meta_title: { en: 'SEO Title' },
      meta_description: { en: 'SEO description.' },
      og_image: { original: 'sj/og.jpg', w1200: 'https://cdn.example.com/og-1200.jpg' },
    });
    const meta = buildSignatureJourneyMetadata(journey, 'en');
    expect(meta.title).toBe('SEO Title');
    expect(meta.description).toBe('SEO description.');
    expect(meta.openGraph?.images).toEqual([{ url: 'https://cdn.example.com/og-1200.jpg' }]);
  });

  it('falls back to title/description/cover_image when meta_* / og_image absent', () => {
    const meta = buildSignatureJourneyMetadata(makeJourney(), 'en');
    expect(meta.title).toBe('Aegean Odyssey');
    expect(meta.description).toBe('A private yacht voyage.');
    expect(meta.openGraph?.images).toEqual([{ url: 'https://cdn.example.com/cover-1200.jpg' }]);
  });

  it('sets a relative canonical + ko/en language alternates', () => {
    const meta = buildSignatureJourneyMetadata(makeJourney(), 'en');
    expect(meta.alternates?.canonical).toBe('/signature-journeys/aegean-odyssey');
    expect(meta.alternates?.languages).toEqual({
      ko: '/signature-journeys/aegean-odyssey',
      en: '/signature-journeys/aegean-odyssey',
    });
  });

  it('emits ko_KR OG locale + en_US alternate on KR (kr→ko mapping)', () => {
    const meta = buildSignatureJourneyMetadata(makeJourney(), 'kr');
    expect(meta.openGraph?.locale).toBe('ko_KR');
    expect(meta.openGraph?.alternateLocale).toEqual(['en_US']);
    expect(meta.title).toBe('에게해 오디세이');
  });

  it('emits en_US OG locale + ko_KR alternate on EN', () => {
    const meta = buildSignatureJourneyMetadata(makeJourney(), 'en');
    expect(meta.openGraph?.locale).toBe('en_US');
    expect(meta.openGraph?.alternateLocale).toEqual(['ko_KR']);
  });

  it('canonical/OG url use the real publish domain', () => {
    const meta = buildSignatureJourneyMetadata(makeJourney(), 'en');
    expect(meta.openGraph?.url).toBe(
      'https://www.travelinyourpocket.com/signature-journeys/aegean-odyssey',
    );
  });
});
