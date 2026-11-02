/**
 * Where the site's concierge calls to action go (SMA-788, web twin of the
 * app's SMA-783/784/787).
 *
 * A bare `/concierge` RESUMES the last-used conversation (stored session,
 * else the most recent) — right for the header/footer CONCIERGE nav item.
 * Every "start a conversation" CTA (home hero, detail-page bands, About
 * "Begin your journey", empty-state "plan a trip", …) must instead open a
 * fresh one, which `?new=1` asks the concierge bootstrap to do.
 */
export const NEW_CHAT_PARAM = 'new';

export const NEW_CONCIERGE_CHAT_HREF = `/concierge?${NEW_CHAT_PARAM}=1`;

export function isNewChatRequest(value: string | null | undefined): boolean {
  return value === '1' || value === 'true';
}
