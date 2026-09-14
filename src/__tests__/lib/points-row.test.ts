import { describe, expect, it } from 'vitest';
import {
  REVIEW_DELETED_NOTE_MARKER,
  isHiddenNoteMarker,
  isReviewDeletedClawback,
  noteMarkerKindQualifier,
  reviewRewardRemaining,
  withoutHiddenNoteMarker,
} from '@/lib/points-row';
import type { PointTransaction } from '@/types/stay-credit';

function row(overrides: Partial<PointTransaction> & { id: number }): PointTransaction {
  return {
    user_id: 7,
    source: 'review_reward',
    status: 'issued',
    kind: 'grant',
    delta_points: 500,
    trip_id: 42,
    ...overrides,
  };
}

describe('note markers (SMA-363)', () => {
  it('recognises exactly the backend review_deleted marker', () => {
    expect(REVIEW_DELETED_NOTE_MARKER).toBe('review_deleted');
    expect(isHiddenNoteMarker('review_deleted')).toBe(true);
    expect(isHiddenNoteMarker('Review deleted by admin')).toBe(false);
    expect(isHiddenNoteMarker('photo')).toBe(false);
    expect(isHiddenNoteMarker(null)).toBe(false);
    expect(isHiddenNoteMarker(undefined)).toBe(false);
  });

  it('labels a review-deleted clawback and leaves every other row to the kind map', () => {
    const clawback = row({ id: 2, kind: 'clawback', delta_points: -500, notes: 'review_deleted' });
    expect(isReviewDeletedClawback(clawback)).toBe(true);
    expect(noteMarkerKindQualifier(clawback, true)).toBe('Review deleted');
    expect(noteMarkerKindQualifier(clawback, false)).toBe('후기 삭제');

    // A manual clawback (free-text reason) keeps the generic qualifier.
    const manual = row({ id: 3, kind: 'clawback', delta_points: -500, notes: 'Fraud check' });
    expect(isReviewDeletedClawback(manual)).toBe(false);
    expect(noteMarkerKindQualifier(manual, true)).toBeNull();
    // The marker only means something on a clawback row.
    expect(noteMarkerKindQualifier(row({ id: 4, notes: 'review_deleted' }), true)).toBeNull();
  });

  it('blanks a marker note but returns other rows untouched', () => {
    const marked = row({ id: 2, kind: 'clawback', delta_points: -500, notes: 'review_deleted' });
    expect(withoutHiddenNoteMarker(marked).notes).toBeNull();
    const plain = row({ id: 3, notes: 'Thanks for the great review' });
    expect(withoutHiddenNoteMarker(plain)).toBe(plain);
  });
});

describe('reviewRewardRemaining', () => {
  it('returns the untouched grant amount', () => {
    expect(reviewRewardRemaining([row({ id: 1, delta_points: 1000 })], 42)).toBe(1000);
  });

  it('subtracts every companion row that draws the grant down', () => {
    const rows = [
      row({ id: 1, delta_points: 1000 }),
      row({ id: 2, kind: 'use', delta_points: -300, consumes_transaction_id: 1, trip_id: null }),
      row({ id: 3, kind: 'expire', delta_points: -100, consumes_transaction_id: 1, trip_id: null }),
      // A use drawing down some OTHER lot is ignored.
      row({ id: 4, kind: 'use', delta_points: -900, consumes_transaction_id: 99, trip_id: null }),
    ];
    expect(reviewRewardRemaining(rows, 42)).toBe(600);
  });

  it('is null when the trip has no review reward, or nothing is left', () => {
    expect(reviewRewardRemaining([], 42)).toBeNull();
    expect(reviewRewardRemaining([row({ id: 1, trip_id: 7 })], 42)).toBeNull();
    expect(reviewRewardRemaining([row({ id: 1, source: 'payment_points' })], 42)).toBeNull();
    // A `use`/`clawback` row referencing the trip is not a grant lot.
    expect(
      reviewRewardRemaining([row({ id: 1, kind: 'clawback', delta_points: -500 })], 42),
    ).toBeNull();
    expect(
      reviewRewardRemaining(
        [
          row({ id: 1, delta_points: 500 }),
          row({ id: 2, kind: 'use', delta_points: -500, consumes_transaction_id: 1 }),
        ],
        42,
      ),
    ).toBeNull();
  });

  it('resolves the trip from a trip:{id} source_ref when trip_id is absent', () => {
    const legacy = row({ id: 1, trip_id: null, source_ref: 'trip:42:review', delta_points: 500 });
    expect(reviewRewardRemaining([legacy], 42)).toBe(500);
  });
});
