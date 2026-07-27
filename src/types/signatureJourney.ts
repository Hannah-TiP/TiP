import type { Image, MultiLanguageString } from '@/types/common';
import type { FaqItem } from '@/types/hotel';

// TS mirrors of the backend Pydantic read schema for signature_journeys_v2
// (tip-backend v2/data_model/schemas/signature_journey.py, SMA-206).
// Interface names intentionally match the backend model names.

export type SignatureJourneyStatus = 'draft' | 'published';

/** Highlight repeater item (section.highlights). */
export interface Highlight {
  title?: MultiLanguageString | null;
  desc?: MultiLanguageString | null;
}

/** Unit card repeater item (section.units) — suite / aircraft / option. */
export interface Unit {
  image?: Image | null;
  name?: MultiLanguageString | null;
  spec?: MultiLanguageString | null;
  desc?: MultiLanguageString | null;
}

/** Route repeater item (section.routes) — itinerary / course. */
export interface Route {
  region?: MultiLanguageString | null;
  title?: MultiLanguageString | null;
  stops?: MultiLanguageString | null;
  meta?: MultiLanguageString | null;
  map_image?: Image | null;
}

/** Spec repeater item (section.specs) — at-a-glance key/value. */
export interface Spec {
  key?: MultiLanguageString | null;
  value?: MultiLanguageString | null;
}

/** Inclusion list item (section.inclusions). */
export interface Inclusion {
  item?: MultiLanguageString | null;
}

/** FAQ repeater item (section.faq). */
export interface FAQ {
  question?: MultiLanguageString | null;
  answer?: MultiLanguageString | null;
}

/**
 * Booking-benefit card repeater item (section.benefits) — inline per journey.
 * `mark` is the small eyebrow label (e.g. "Virtuoso Voyages"), `title` the
 * card heading, `desc` the card body.
 */
export interface Benefit {
  mark?: MultiLanguageString | null;
  title?: MultiLanguageString | null;
  desc?: MultiLanguageString | null;
}

export interface SignatureJourney {
  id: number;
  city_id?: number | null;
  slug: string;
  status: SignatureJourneyStatus;
  title?: MultiLanguageString | null;
  description?: MultiLanguageString | null;
  hero_image?: Image | null;
  cover_image?: Image | null;
  lead?: MultiLanguageString | null;
  body?: MultiLanguageString | null;
  gallery?: Image[] | null;
  highlights?: Highlight[] | null;
  units?: Unit[] | null;
  routes?: Route[] | null;
  specs?: Spec[] | null;
  inclusions?: Inclusion[] | null;
  faqs?: FAQ[] | null;
  benefits?: Benefit[] | null;
  meta_title?: MultiLanguageString | null;
  meta_description?: MultiLanguageString | null;
  og_image?: Image | null;
  schema_version: number;
  created_at?: string | null;
  updated_at?: string | null;
}

/**
 * Normalize the journey's nullable FAQ repeater into the non-null `FaqItem[]`
 * shape the shared `<FaqAccordion>` expects. Items without a question are
 * dropped; a missing answer becomes an empty MultiLanguageString (the
 * accordion renders nothing for it).
 */
export function toFaqItems(faqs?: FAQ[] | null): FaqItem[] {
  if (!faqs) return [];
  return faqs
    .filter(
      (faq): faq is FAQ & { question: MultiLanguageString } =>
        !!faq.question && !!(faq.question.en || faq.question.kr),
    )
    .map((faq) => ({ question: faq.question, answer: faq.answer ?? {} }));
}
