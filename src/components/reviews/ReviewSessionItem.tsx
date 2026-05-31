'use client';

import StarRating from '@/components/reviews/StarRating';
import type { ReviewableEntity } from '@/lib/trip-utils';
import type { Review } from '@/types/review';

export type ReviewItemStatus = 'not-reviewed' | 'draft' | 'submitted' | 'locked';

export interface ReviewItemValue {
  rating: number;
  comment: string;
  skipped: boolean;
}

interface ReviewSessionItemProps {
  entity: ReviewableEntity;
  /** The current user's existing review for this entity, if any. */
  existingReview: Review | null;
  /** Controlled form value (owned by the session page). */
  value: ReviewItemValue;
  onRatingChange: (rating: number) => void;
  onCommentChange: (comment: string) => void;
  onSkipToggle: () => void;
  /** Delete is a distinct destructive action, kept per-item. */
  onDelete: () => void;
  /** Whether the parent is currently deleting this item's review. */
  isDeleting: boolean;
  /** Per-item error surfaced after the trip-level submit (or delete). */
  error: string | null;
}

const TYPE_LABEL: Record<ReviewableEntity['entityType'], string> = {
  hotel: 'Hotel',
  restaurant: 'Restaurant',
  activity: 'Activity',
};

const TYPE_BADGE_COLOR: Record<ReviewableEntity['entityType'], string> = {
  hotel: 'bg-purple-100 text-purple-700',
  restaurant: 'bg-amber-100 text-amber-700',
  activity: 'bg-green-100 text-green-700',
};

function statusOf(existingReview: Review | null, value: ReviewItemValue): ReviewItemStatus {
  if (existingReview) {
    return existingReview.locked_at ? 'locked' : 'submitted';
  }
  return value.rating > 0 || value.comment.trim() !== '' ? 'draft' : 'not-reviewed';
}

const STATUS_PILL: Record<ReviewItemStatus, { label: string; className: string }> = {
  'not-reviewed': { label: 'Not Reviewed', className: 'bg-gray-100 text-gray-600' },
  draft: { label: 'Draft', className: 'bg-blue-100 text-blue-700' },
  submitted: { label: 'Submitted', className: 'bg-green-100 text-green-700' },
  locked: { label: 'Locked', className: 'bg-gray-200 text-gray-500' },
};

export default function ReviewSessionItem({
  entity,
  existingReview,
  value,
  onRatingChange,
  onCommentChange,
  onSkipToggle,
  onDelete,
  isDeleting,
  error,
}: ReviewSessionItemProps) {
  const isLocked = !!existingReview?.locked_at;
  const { skipped } = value;
  const status = statusOf(existingReview, value);
  const pill = skipped
    ? { label: 'Skipped', className: 'bg-gray-200 text-gray-500' }
    : STATUS_PILL[status];

  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white p-6 transition ${
        skipped ? 'opacity-50' : ''
      }`}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={`rounded px-2 py-0.5 text-xs font-medium ${TYPE_BADGE_COLOR[entity.entityType]}`}
          >
            {TYPE_LABEL[entity.entityType]}
          </span>
          <h3 className="font-semibold text-gray-900">{entity.title}</h3>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${pill.className}`}>
          {pill.label}
        </span>
      </div>

      {isLocked ? (
        <div>
          <StarRating value={existingReview!.rating} size="md" />
          {existingReview!.comment && (
            <p className="mt-3 text-sm leading-relaxed text-gray-600">{existingReview!.comment}</p>
          )}
          <p className="mt-4 text-xs text-gray-400">
            This review is locked — the 30-day edit window has closed.
          </p>
        </div>
      ) : (
        <div>
          <div className="mb-4">
            <p className="mb-2 text-sm font-medium text-gray-700">Your Rating</p>
            <StarRating
              value={value.rating}
              onChange={onRatingChange}
              size="lg"
              label={`Rating for ${entity.title}`}
            />
          </div>
          <div className="mb-4">
            <p className="mb-2 text-sm font-medium text-gray-700">Your Review (optional)</p>
            <textarea
              value={value.comment}
              onChange={(e) => onCommentChange(e.target.value)}
              disabled={skipped}
              placeholder={`Share your experience at ${entity.title}...`}
              rows={4}
              className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-[#1E3D2F] focus:outline-none focus:ring-2 focus:ring-[#1E3D2F]/20 disabled:bg-gray-50"
            />
          </div>
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={onSkipToggle}
              className="text-sm font-medium text-gray-500 hover:underline"
            >
              {skipped ? 'Unskip' : 'Skip'}
            </button>
            {existingReview && (
              <button
                type="button"
                onClick={onDelete}
                disabled={isDeleting}
                className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
              >
                {isDeleting ? 'Deleting…' : 'Delete'}
              </button>
            )}
          </div>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
