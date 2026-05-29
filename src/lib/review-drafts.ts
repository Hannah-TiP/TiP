import type { ReviewEntityType } from '@/types/review';

export interface ReviewDraft {
  rating: number;
  comment: string;
}

type DraftMap = Record<string, ReviewDraft>;

function storageKey(tripId: number): string {
  return `tip-review-drafts:${tripId}`;
}

function entityKey(entityType: ReviewEntityType, entityId: number): string {
  return `${entityType}:${entityId}`;
}

function readAll(tripId: number): DraftMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(storageKey(tripId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as DraftMap) : {};
  } catch {
    return {};
  }
}

function writeAll(tripId: number, drafts: DraftMap): void {
  if (typeof window === 'undefined') return;
  try {
    if (Object.keys(drafts).length === 0) {
      window.localStorage.removeItem(storageKey(tripId));
    } else {
      window.localStorage.setItem(storageKey(tripId), JSON.stringify(drafts));
    }
  } catch {
    // Storage unavailable (private mode / quota) — drafts simply won't persist.
  }
}

export function loadDrafts(tripId: number): DraftMap {
  return readAll(tripId);
}

export function getDraft(
  tripId: number,
  entityType: ReviewEntityType,
  entityId: number,
): ReviewDraft | null {
  return readAll(tripId)[entityKey(entityType, entityId)] ?? null;
}

export function saveDraft(
  tripId: number,
  entityType: ReviewEntityType,
  entityId: number,
  draft: ReviewDraft,
): void {
  const drafts = readAll(tripId);
  drafts[entityKey(entityType, entityId)] = draft;
  writeAll(tripId, drafts);
}

export function clearDraft(tripId: number, entityType: ReviewEntityType, entityId: number): void {
  const drafts = readAll(tripId);
  delete drafts[entityKey(entityType, entityId)];
  writeAll(tripId, drafts);
}
