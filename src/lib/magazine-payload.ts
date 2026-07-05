import type { GuideStep, InsiderTopic, MagazineArticle, NewsCategory } from '@/types/magazine';

/**
 * Pure, forward-compatible accessors that narrow an article's untyped
 * `type_payload` (a `Record<string, unknown> | null`) into the typed per-type
 * shapes the Guide / News / Insider render modules + JSON-LD builders consume.
 *
 * Every accessor tolerates a missing / malformed payload and returns an empty /
 * null result — a missing payload renders nothing without crashing (the
 * forward-compat rule shared with the body-block renderer). These are the SINGLE
 * source of truth shared by BOTH the on-screen render and the JSON-LD (parity).
 */

const NEWS_CATEGORIES: readonly NewsCategory[] = ['opening', 'brand_news', 'award', 'michelin'];

const INSIDER_TOPICS: readonly InsiderTopic[] = [
  'virtuoso',
  'booking',
  'upgrade',
  'membership',
  'behind_the_scenes',
];

function payloadOf(article: MagazineArticle): Record<string, unknown> {
  const payload = article.type_payload;
  return payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
}

function isMls(value: unknown): value is { en?: string | null; kr?: string | null } {
  return typeof value === 'object' && value !== null;
}

/**
 * The ordered Guide steps. Each raw entry is normalized into a `GuideStep`;
 * entries that are not objects are dropped. Empty when the payload has no valid
 * `steps` array.
 */
export function guideSteps(article: MagazineArticle): GuideStep[] {
  const raw = payloadOf(article).steps;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((step): step is Record<string, unknown> => typeof step === 'object' && step !== null)
    .map((step) => ({
      label: isMls(step.label) ? step.label : null,
      title: isMls(step.title) ? step.title : null,
      body: isMls(step.body) ? step.body : null,
      hotel_id: typeof step.hotel_id === 'number' ? step.hotel_id : null,
    }));
}

/** The News category, or `null` when absent / out of the known enum. */
export function newsCategory(article: MagazineArticle): NewsCategory | null {
  const value = payloadOf(article).category;
  return NEWS_CATEGORIES.includes(value as NewsCategory) ? (value as NewsCategory) : null;
}

/** The Insider topic, or `null` when absent / out of the known enum. */
export function insiderTopic(article: MagazineArticle): InsiderTopic | null {
  const value = payloadOf(article).topic;
  return INSIDER_TOPICS.includes(value as InsiderTopic) ? (value as InsiderTopic) : null;
}
