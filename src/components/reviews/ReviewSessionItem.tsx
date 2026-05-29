'use client';

import { useEffect, useState } from 'react';
import StarRating from '@/components/reviews/StarRating';
import { apiClient } from '@/lib/api-client';
import { clearDraft, getDraft, saveDraft } from '@/lib/review-drafts';
import type { ReviewableEntity } from '@/lib/trip-utils';
import type { Review } from '@/types/review';

export type ReviewItemStatus = 'not-reviewed' | 'draft' | 'submitted' | 'locked';

interface ReviewSessionItemProps {
  tripId: number;
  entity: ReviewableEntity;
  /** The current user's existing review for this entity, if any. */
  existingReview: Review | null;
  /** Called after a successful submit/update/delete so the page can refresh status. */
  onChanged: () => void;
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

function statusOf(existingReview: Review | null, hasDraft: boolean): ReviewItemStatus {
  if (existingReview) {
    return existingReview.locked_at ? 'locked' : 'submitted';
  }
  return hasDraft ? 'draft' : 'not-reviewed';
}

const STATUS_PILL: Record<ReviewItemStatus, { label: string; className: string }> = {
  'not-reviewed': { label: 'Not Reviewed', className: 'bg-gray-100 text-gray-600' },
  draft: { label: 'Draft', className: 'bg-blue-100 text-blue-700' },
  submitted: { label: 'Submitted', className: 'bg-green-100 text-green-700' },
  locked: { label: 'Locked', className: 'bg-gray-200 text-gray-500' },
};

export default function ReviewSessionItem({
  tripId,
  entity,
  existingReview,
  onChanged,
}: ReviewSessionItemProps) {
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLocked = !!existingReview?.locked_at;
  const draft = !existingReview ? getDraft(tripId, entity.entityType, entity.entityId) : null;
  const status = statusOf(existingReview, !!draft);

  // Seed the form: from the existing review (when editing) or the saved draft.
  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setComment(existingReview.comment ?? '');
    } else {
      const d = getDraft(tripId, entity.entityType, entity.entityId);
      setRating(d?.rating ?? 0);
      setComment(d?.comment ?? '');
    }
    // Re-seed whenever the underlying review identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingReview?.id, tripId, entity.entityType, entity.entityId]);

  const persistDraft = (nextRating: number, nextComment: string) => {
    if (existingReview) return;
    if (nextRating === 0 && nextComment.trim() === '') {
      clearDraft(tripId, entity.entityType, entity.entityId);
    } else {
      saveDraft(tripId, entity.entityType, entity.entityId, {
        rating: nextRating,
        comment: nextComment,
      });
    }
  };

  const handleRatingChange = (next: number) => {
    setRating(next);
    persistDraft(next, comment);
  };

  const handleCommentChange = (next: string) => {
    setComment(next);
    persistDraft(rating, next);
  };

  const handleSubmit = async () => {
    if (rating < 1) {
      setError('Please choose a star rating.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      if (existingReview) {
        await apiClient.updateReview(existingReview.id, {
          rating,
          comment: comment.trim() || null,
        });
      } else {
        await apiClient.createReview({
          trip_id: tripId,
          entity_type: entity.entityType,
          entity_id: entity.entityId,
          rating,
          comment: comment.trim() || null,
        });
        clearDraft(tripId, entity.entityType, entity.entityId);
      }
      setEditing(false);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit your review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!existingReview) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await apiClient.deleteReview(existingReview.id);
      setEditing(false);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete your review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const pill = STATUS_PILL[status];
  const showForm = !existingReview || editing;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
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

      {/* Submitted / locked summary */}
      {existingReview && !editing && (
        <div>
          <StarRating value={existingReview.rating} size="md" />
          {existingReview.comment && (
            <p className="mt-3 text-sm leading-relaxed text-gray-600">{existingReview.comment}</p>
          )}
          {isLocked ? (
            <p className="mt-4 text-xs text-gray-400">
              This review is locked — the 30-day edit window has closed.
            </p>
          ) : (
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-sm font-medium text-[#1E3D2F] hover:underline"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      )}

      {/* Editable form */}
      {showForm && (
        <div>
          <div className="mb-4">
            <p className="mb-2 text-sm font-medium text-gray-700">Your Rating</p>
            <StarRating
              value={rating}
              onChange={handleRatingChange}
              size="lg"
              label={`Rating for ${entity.title}`}
            />
          </div>
          <div className="mb-4">
            <p className="mb-2 text-sm font-medium text-gray-700">Your Review (optional)</p>
            <textarea
              value={comment}
              onChange={(e) => handleCommentChange(e.target.value)}
              placeholder={`Share your experience at ${entity.title}...`}
              rows={4}
              className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-[#1E3D2F] focus:outline-none focus:ring-2 focus:ring-[#1E3D2F]/20"
            />
          </div>
          <div className="flex items-center justify-end gap-3">
            {editing && (
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setError(null);
                }}
                className="text-sm font-medium text-gray-500 hover:underline"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="rounded-lg bg-[#1E3D2F] px-6 py-2.5 text-sm text-white transition hover:bg-[#163024] disabled:opacity-50"
            >
              {isSubmitting ? 'Saving…' : existingReview ? 'Save Changes' : 'Submit Review'}
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
