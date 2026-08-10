import type { AIChatMessage } from '@/types/ai-chat';

/**
 * Union-merge store for concierge chat messages (SMA-288).
 *
 * Every fetch (initial tail read, 1s human-mode poll, load-older page,
 * send-message append) merges into one `Map<message_id, message>` instead of
 * wholesale-replacing the array. Fresher fetch data overwrites existing
 * entries by id — so edits/tombstones inside the newest-500 poll window keep
 * refreshing — while rows that slide out of the poll window survive from
 * earlier fetches (prepended history is never wiped by the poll).
 */
export type ChatMessageStore = Map<number, AIChatMessage>;

/** The backend default window for the initial tail read (SMA-287). */
export const INITIAL_HISTORY_LIMIT = 500;

/** Page size for "load older messages" requests. */
export const OLDER_PAGE_LIMIT = 100;

export function emptyMessageStore(): ChatMessageStore {
  return new Map();
}

export function mergeMessages(
  store: ChatMessageStore,
  incoming: AIChatMessage[],
): ChatMessageStore {
  const next = new Map(store);
  for (const message of incoming) {
    next.set(message.id, message);
  }
  return next;
}

function sortKey(message: AIChatMessage): string {
  return message.sent_at ?? message.created_at ?? '';
}

/** Render order: chronological by (sent_at, id) — id breaks timestamp ties. */
export function sortedMessages(store: ChatMessageStore): AIChatMessage[] {
  return [...store.values()].sort((a, b) => {
    const aKey = sortKey(a);
    const bKey = sortKey(b);
    if (aKey !== bKey) return aKey < bKey ? -1 : 1;
    return a.id - b.id;
  });
}

export function oldestMessageId(messages: AIChatMessage[]): number | null {
  return messages.length > 0 ? messages[0].id : null;
}

/**
 * `has_more` is inferred from page length — a short page (length < requested
 * limit) means there is no more history to load.
 */
export function pageHasMore(pageLength: number, requestedLimit: number): boolean {
  return pageLength >= requestedLimit;
}
