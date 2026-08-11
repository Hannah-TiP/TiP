import { describe, expect, it } from 'vitest';
import {
  emptyMessageStore,
  INITIAL_HISTORY_LIMIT,
  mergeMessages,
  OLDER_PAGE_LIMIT,
  oldestMessageId,
  pageHasMore,
  sortedMessages,
} from '@/lib/chat-message-store';
import type { AIChatMessage } from '@/types/ai-chat';

function makeMessage(id: number, overrides: Partial<AIChatMessage> = {}): AIChatMessage {
  return {
    id,
    user_id: 1,
    trip_id: 10,
    role: 'assistant',
    message_type: 'text',
    content: `message ${id}`,
    sent_at: `2026-08-01T10:${String(id).padStart(2, '0')}:00Z`,
    ...overrides,
  };
}

describe('chat message store', () => {
  it('merges pages by id and renders sorted by (sent_at, id)', () => {
    const tail = [makeMessage(30), makeMessage(31)];
    const older = [makeMessage(10), makeMessage(11)];

    let store = mergeMessages(emptyMessageStore(), tail);
    store = mergeMessages(store, older);

    expect(sortedMessages(store).map((m) => m.id)).toEqual([10, 11, 30, 31]);
  });

  it('breaks sent_at ties by id', () => {
    const sameTime = '2026-08-01T10:00:00Z';
    const store = mergeMessages(emptyMessageStore(), [
      makeMessage(5, { sent_at: sameTime }),
      makeMessage(3, { sent_at: sameTime }),
      makeMessage(4, { sent_at: sameTime }),
    ]);

    expect(sortedMessages(store).map((m) => m.id)).toEqual([3, 4, 5]);
  });

  it('a tail-window poll cannot wipe previously loaded older history', () => {
    // Older page loaded via "load older messages"…
    let store = mergeMessages(emptyMessageStore(), [makeMessage(1), makeMessage(2)]);
    // …then a human-mode poll returns only the newest tail window.
    store = mergeMessages(store, [makeMessage(40), makeMessage(41)]);

    const ids = sortedMessages(store).map((m) => m.id);
    expect(ids).toEqual([1, 2, 40, 41]);
  });

  it('fresher poll data overwrites edits and tombstones inside the tail window', () => {
    let store = mergeMessages(emptyMessageStore(), [
      makeMessage(20, { content: 'original text' }),
      makeMessage(21, { content: 'will be deleted' }),
    ]);

    store = mergeMessages(store, [
      makeMessage(20, { content: 'edited text' }),
      makeMessage(21, { content: null, deleted_at: '2026-08-01T11:00:00Z' }),
    ]);

    const byId = new Map(sortedMessages(store).map((m) => [m.id, m]));
    expect(byId.get(20)?.content).toBe('edited text');
    expect(byId.get(21)?.deleted_at).toBe('2026-08-01T11:00:00Z');
    expect(byId.get(21)?.content).toBeNull();
  });

  it('does not mutate the previous store on merge', () => {
    const original = mergeMessages(emptyMessageStore(), [makeMessage(1)]);
    const next = mergeMessages(original, [makeMessage(2)]);

    expect(original.size).toBe(1);
    expect(next.size).toBe(2);
  });

  it('falls back to created_at, then empty, for the sort key', () => {
    const store = mergeMessages(emptyMessageStore(), [
      makeMessage(2, { sent_at: null, created_at: '2026-08-01T09:00:00Z' }),
      makeMessage(9, { sent_at: '2026-08-01T10:00:00Z' }),
      makeMessage(1, { sent_at: null, created_at: null }),
    ]);

    expect(sortedMessages(store).map((m) => m.id)).toEqual([1, 2, 9]);
  });

  it('oldestMessageId returns the first sorted id, or null when empty', () => {
    const store = mergeMessages(emptyMessageStore(), [makeMessage(7), makeMessage(3)]);
    expect(oldestMessageId(sortedMessages(store))).toBe(3);
    expect(oldestMessageId([])).toBeNull();
  });

  it('pageHasMore infers has_more from page length vs requested limit', () => {
    expect(pageHasMore(INITIAL_HISTORY_LIMIT, INITIAL_HISTORY_LIMIT)).toBe(true);
    expect(pageHasMore(INITIAL_HISTORY_LIMIT - 1, INITIAL_HISTORY_LIMIT)).toBe(false);
    expect(pageHasMore(OLDER_PAGE_LIMIT, OLDER_PAGE_LIMIT)).toBe(true);
    expect(pageHasMore(0, OLDER_PAGE_LIMIT)).toBe(false);
  });
});
