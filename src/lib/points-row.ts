// Ledger-row display helpers driven by backend NOTE MARKERS (SMA-363).
//
// Some ledger rows carry a machine marker in `notes` instead of free text —
// e.g. the clawback the backend appends when a member deletes an approved
// review is `kind: 'clawback'`, `source: 'review_reward'`,
// `notes: 'review_deleted'`, and the review-reward clawback written when an
// admin marks a trip no-show (SMA-362) carries `notes: 'no-show'`. Markers
// drive the wallet's kind qualifier and are never rendered as a note. Kept
// separate from `types/stay-credit.ts` (which owns the source/kind label
// maps) so the marker vocabulary has one home.

import { isPointsGrantLot, tripIdFromCredit, type PointTransaction } from '@/types/stay-credit';

/** Exact `notes` marker the backend writes on a review-deletion clawback row. */
export const REVIEW_DELETED_NOTE_MARKER = 'review_deleted';

/** Exact `notes` marker the backend writes on a no-show clawback row (SMA-362). */
export const NO_SHOW_NOTE_MARKER = 'no-show';

const HIDDEN_NOTE_MARKERS: ReadonlySet<string> = new Set([
  REVIEW_DELETED_NOTE_MARKER,
  NO_SHOW_NOTE_MARKER,
]);

const REVIEW_DELETED_KIND_LABEL = { en: 'Review deleted', kr: '후기 삭제' };

const NO_SHOW_KIND_LABEL = { en: 'No-show', kr: '노쇼' };

/** Whether a row's `notes` is a machine marker that must not render as text. */
export function isHiddenNoteMarker(notes: string | null | undefined): boolean {
  return !!notes && HIDDEN_NOTE_MARKERS.has(notes);
}

/** A `clawback` row appended because the member deleted an approved review. */
export function isReviewDeletedClawback(row: PointTransaction): boolean {
  return row.kind === 'clawback' && row.notes === REVIEW_DELETED_NOTE_MARKER;
}

/** A `clawback` row appended because an admin marked the trip no-show. */
export function isNoShowClawback(row: PointTransaction): boolean {
  return row.kind === 'clawback' && row.notes === NO_SHOW_NOTE_MARKER;
}

/**
 * Kind qualifier implied by a note marker ("Review deleted / 후기 삭제",
 * "No-show / 노쇼"), or null when the generic `POINT_TRANSACTION_KIND_LABELS`
 * map applies.
 */
export function noteMarkerKindQualifier(row: PointTransaction, en: boolean): string | null {
  const lang = en ? 'en' : 'kr';
  if (isReviewDeletedClawback(row)) return REVIEW_DELETED_KIND_LABEL[lang];
  if (isNoShowClawback(row)) return NO_SHOW_KIND_LABEL[lang];
  return null;
}

/** The row with a marker `notes` blanked so the notes line never shows it. */
export function withoutHiddenNoteMarker(row: PointTransaction): PointTransaction {
  return isHiddenNoteMarker(row.notes) ? { ...row, notes: null } : row;
}

/**
 * Unconsumed remainder of the trip's `review_reward` grant(s): the grant
 * delta plus every companion row (`use`/`clawback`/`expire`) that draws it
 * down via `consumes_transaction_id`. This is what the backend claws back
 * when the approved review is deleted. Null when the trip has no review
 * reward on the ledger or nothing is left to reclaim.
 */
export function reviewRewardRemaining(rows: PointTransaction[], tripId: number): number | null {
  const grants = rows.filter(
    (row) =>
      row.source === 'review_reward' &&
      isPointsGrantLot(row.kind) &&
      tripIdFromCredit(row) === tripId,
  );
  if (grants.length === 0) return null;
  const grantIds = new Set(grants.map((g) => g.id));
  let remaining = 0;
  for (const row of rows) {
    if (grantIds.has(row.id)) {
      remaining += row.delta_points ?? 0;
    } else if (row.consumes_transaction_id != null && grantIds.has(row.consumes_transaction_id)) {
      remaining += row.delta_points ?? 0;
    }
  }
  return remaining > 0 ? remaining : null;
}
