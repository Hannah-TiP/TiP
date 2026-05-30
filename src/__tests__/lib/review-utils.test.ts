import { describe, it, expect, beforeEach } from 'vitest';
import { toReviewableEntities } from '@/lib/trip-utils';
import { clearDraft, getDraft, loadDrafts, saveDraft } from '@/lib/review-drafts';
import { installMockLocalStorage } from '@/__tests__/helpers/mock-local-storage';
import type { TripPlanItem } from '@/types/trip';

installMockLocalStorage();

describe('toReviewableEntities', () => {
  it('maps hotel/restaurant/activity items to entity targets and skips free-text items', () => {
    const items: TripPlanItem[] = [
      { item_type: 'hotel', hotel_id: 5, title: 'Aman Tokyo' },
      { item_type: 'restaurant', restaurant_id: 12, title: 'Narisawa' },
      { item_type: 'activity', activity_id: 8, title: 'Tea Ceremony' },
      { item_type: 'note', title: 'Remember sunscreen' },
      // hotel without an id (free-text accommodation) is excluded
      { item_type: 'hotel', title: 'Some boutique place' },
    ];

    const result = toReviewableEntities(items);

    expect(result).toEqual([
      { entityType: 'hotel', entityId: 5, title: 'Aman Tokyo' },
      { entityType: 'restaurant', entityId: 12, title: 'Narisawa' },
      { entityType: 'activity', entityId: 8, title: 'Tea Ceremony' },
    ]);
  });

  it('de-duplicates an entity that appears on multiple days', () => {
    const items: TripPlanItem[] = [
      { item_type: 'hotel', hotel_id: 5, title: 'Aman Tokyo (night 1)' },
      { item_type: 'hotel', hotel_id: 5, title: 'Aman Tokyo (night 2)' },
    ];

    const result = toReviewableEntities(items);

    expect(result).toHaveLength(1);
    expect(result[0].entityId).toBe(5);
  });
});

describe('review-drafts localStorage persistence', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('saves, reads, and clears a draft scoped by trip + entity', () => {
    saveDraft(1, 'hotel', 5, { rating: 4, comment: 'Nice' });

    expect(getDraft(1, 'hotel', 5)).toEqual({ rating: 4, comment: 'Nice' });
    // Different entity in the same trip is independent.
    expect(getDraft(1, 'hotel', 6)).toBeNull();

    clearDraft(1, 'hotel', 5);
    expect(getDraft(1, 'hotel', 5)).toBeNull();
  });

  it('loadDrafts returns the full map for a trip', () => {
    saveDraft(2, 'hotel', 5, { rating: 5, comment: '' });
    saveDraft(2, 'restaurant', 9, { rating: 3, comment: 'ok' });

    const drafts = loadDrafts(2);

    expect(Object.keys(drafts).sort()).toEqual(['hotel:5', 'restaurant:9']);
  });
});
