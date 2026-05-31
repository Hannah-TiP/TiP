'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Footer from '@/components/Footer';
import ReviewSessionItem, { type ReviewItemValue } from '@/components/reviews/ReviewSessionItem';
import { apiClient } from '@/lib/api-client';
import {
  getTripReviewableItems,
  getTripWithVersion,
  toReviewableEntities,
  type ReviewableEntity,
  type TripWithVersion,
} from '@/lib/trip-utils';
import { clearDraft, getDraft, isSkipped, saveDraft, setSkipped } from '@/lib/review-drafts';
import type { Review } from '@/types/review';

interface SessionState {
  trip: TripWithVersion;
  entities: ReviewableEntity[];
  userId: number;
  /** Map of "entityType:entityId" -> the current user's existing review. */
  reviewsByEntity: Record<string, Review | null>;
}

interface SubmitResult {
  succeeded: number;
  failed: string[];
}

function entityKey(entity: ReviewableEntity): string {
  return `${entity.entityType}:${entity.entityId}`;
}

async function findUserReview(entity: ReviewableEntity, userId: number): Promise<Review | null> {
  try {
    const list = await apiClient.getReviewsByEntity(entity.entityType, entity.entityId);
    const match = list.reviews.find((r) => r.author.id === userId && r.review.deleted_at == null);
    return match?.review ?? null;
  } catch {
    return null;
  }
}

function seedValue(
  tripId: number,
  entity: ReviewableEntity,
  existing: Review | null,
): ReviewItemValue {
  const skipped = isSkipped(tripId, entity.entityType, entity.entityId);
  if (existing) {
    return { rating: existing.rating, comment: existing.comment ?? '', skipped };
  }
  const draft = getDraft(tripId, entity.entityType, entity.entityId);
  return { rating: draft?.rating ?? 0, comment: draft?.comment ?? '', skipped };
}

export default function ReviewsPage() {
  const { id } = useParams<{ id: string }>();
  const tripId = Number(id);
  const [state, setState] = useState<SessionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [values, setValues] = useState<Record<string, ReviewItemValue>>({});
  const [itemErrors, setItemErrors] = useState<Record<string, string>>({});
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);

  const load = useCallback(async () => {
    if (!tripId) return;
    try {
      setError(null);
      const [trip, user] = await Promise.all([getTripWithVersion(tripId), apiClient.getProfile()]);
      const entities = toReviewableEntities(getTripReviewableItems(trip.currentVersion));
      const reviews = await Promise.all(entities.map((e) => findUserReview(e, user.id)));
      const reviewsByEntity: Record<string, Review | null> = {};
      const nextValues: Record<string, ReviewItemValue> = {};
      entities.forEach((e, i) => {
        const key = entityKey(e);
        reviewsByEntity[key] = reviews[i];
        nextValues[key] = seedValue(tripId, e, reviews[i]);
      });
      setState({ trip, entities, userId: user.id, reviewsByEntity });
      setValues(nextValues);
      setItemErrors({});
    } catch {
      setError('Failed to load trip details.');
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    load();
  }, [load]);

  const updateValue = useCallback(
    (key: string, patch: Partial<ReviewItemValue>) => {
      setValues((prev) => {
        const next = { ...prev[key], ...patch };
        const existing = state?.reviewsByEntity[key] ?? null;
        // Persist drafts for not-yet-submitted items (existing reviews are not drafts).
        if (!existing && (patch.rating !== undefined || patch.comment !== undefined)) {
          const [type, idStr] = key.split(':');
          const entityType = type as ReviewableEntity['entityType'];
          const entityId = Number(idStr);
          if (next.rating === 0 && next.comment.trim() === '') {
            clearDraft(tripId, entityType, entityId);
          } else {
            saveDraft(tripId, entityType, entityId, {
              rating: next.rating,
              comment: next.comment,
            });
          }
        }
        return { ...prev, [key]: next };
      });
    },
    [state, tripId],
  );

  const handleSkipToggle = useCallback(
    (entity: ReviewableEntity) => {
      const key = entityKey(entity);
      setValues((prev) => {
        const next = !prev[key].skipped;
        setSkipped(tripId, entity.entityType, entity.entityId, next);
        return { ...prev, [key]: { ...prev[key], skipped: next } };
      });
    },
    [tripId],
  );

  const handleDelete = useCallback(
    async (entity: ReviewableEntity, review: Review) => {
      const key = entityKey(entity);
      setDeletingKey(key);
      setItemErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      try {
        await apiClient.deleteReview(review.id);
        await load();
      } catch (err) {
        setItemErrors((prev) => ({
          ...prev,
          [key]: err instanceof Error ? err.message : 'Failed to delete your review.',
        }));
      } finally {
        setDeletingKey(null);
      }
    },
    [load],
  );

  const eligibleEntities = useMemo(() => {
    if (!state) return [];
    return state.entities.filter((entity) => {
      const key = entityKey(entity);
      const value = values[key];
      const existing = state.reviewsByEntity[key];
      if (!value || value.skipped) return false;
      if (existing?.locked_at) return false;
      if (value.rating < 1) return false;
      if (existing) {
        // Existing review: only submit if edited.
        return (
          value.rating !== existing.rating || value.comment.trim() !== (existing.comment ?? '')
        );
      }
      return true;
    });
  }, [state, values]);

  const handleSubmitAll = useCallback(async () => {
    if (!state || eligibleEntities.length === 0) return;
    setSubmitting(true);
    setResult(null);
    setItemErrors({});

    const outcomes = await Promise.all(
      eligibleEntities.map(async (entity) => {
        const key = entityKey(entity);
        const value = values[key];
        const existing = state.reviewsByEntity[key];
        try {
          if (existing) {
            await apiClient.updateReview(existing.id, {
              rating: value.rating,
              comment: value.comment.trim() || null,
            });
          } else {
            await apiClient.createReview({
              trip_id: tripId,
              entity_type: entity.entityType,
              entity_id: entity.entityId,
              rating: value.rating,
              comment: value.comment.trim() || null,
            });
            clearDraft(tripId, entity.entityType, entity.entityId);
          }
          return { key, ok: true as const, title: entity.title };
        } catch (err) {
          return {
            key,
            ok: false as const,
            title: entity.title,
            message: err instanceof Error ? err.message : 'Failed to submit your review.',
          };
        }
      }),
    );

    const nextErrors: Record<string, string> = {};
    let succeeded = 0;
    const failed: string[] = [];
    for (const outcome of outcomes) {
      if (outcome.ok) {
        succeeded += 1;
      } else {
        nextErrors[outcome.key] = outcome.message;
        failed.push(outcome.title);
      }
    }
    setResult({ succeeded, failed });
    setSubmitting(false);
    // Re-seed from the server (submitted items now have reviews), then re-apply
    // the failure errors that the reload cleared so they stay visible.
    await load();
    setItemErrors(nextErrors);
  }, [state, eligibleEntities, values, tripId, load]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto mt-8 max-w-4xl space-y-4 px-6 animate-pulse">
          <div className="h-8 w-1/3 rounded bg-gray-200" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-xl bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !state) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto mt-8 max-w-4xl px-6 py-20 text-center text-gray-500">
          <p>{error ?? 'Trip not found.'}</p>
          <Link
            href="/my-page/travel-history"
            className="mt-4 inline-block text-sm text-[#1E3D2F] hover:underline"
          >
            ← Back to Travel History
          </Link>
        </div>
      </div>
    );
  }

  const { trip, entities, reviewsByEntity } = state;
  const destination = trip.currentVersion?.title?.trim() || 'Your Trip';
  const submittedCount = entities.filter((e) => reviewsByEntity[entityKey(e)]).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto mt-8 mb-16 max-w-4xl px-6">
        <Link
          href={`/my-page/travel-history/${trip.trip.id}`}
          className="mb-6 inline-block text-sm text-gray-500 hover:text-gray-900"
        >
          ← Back to Trip
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Review Your Experience</h1>
          <p className="text-gray-500">{destination}</p>
          {entities.length > 0 && (
            <p className="mt-2 text-sm text-gray-500">
              {submittedCount} of {entities.length} reviewed
            </p>
          )}
        </div>

        {entities.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
            <p className="text-gray-500">
              There are no TiP-listed hotels, restaurants, or activities to review on this trip.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-5">
              {entities.map((entity) => {
                const key = entityKey(entity);
                const existing = reviewsByEntity[key] ?? null;
                const value = values[key] ?? { rating: 0, comment: '', skipped: false };
                return (
                  <ReviewSessionItem
                    key={key}
                    entity={entity}
                    existingReview={existing}
                    value={value}
                    onRatingChange={(rating) => updateValue(key, { rating })}
                    onCommentChange={(comment) => updateValue(key, { comment })}
                    onSkipToggle={() => handleSkipToggle(entity)}
                    onDelete={() => existing && handleDelete(entity, existing)}
                    isDeleting={deletingKey === key}
                    error={itemErrors[key] ?? null}
                  />
                );
              })}
            </div>

            <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
              {result && (
                <div className="mb-4 text-sm">
                  {result.succeeded > 0 && (
                    <p className="text-green-700">
                      {result.succeeded} review{result.succeeded === 1 ? '' : 's'} submitted.
                    </p>
                  )}
                  {result.failed.length > 0 && (
                    <p className="text-red-600">
                      Couldn’t submit: {result.failed.join(', ')}. See the items above.
                    </p>
                  )}
                </div>
              )}
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-gray-500">
                  {eligibleEntities.length === 0
                    ? 'Add a rating to an item to submit your reviews.'
                    : `${eligibleEntities.length} ready to submit.`}
                </p>
                <button
                  type="button"
                  onClick={handleSubmitAll}
                  disabled={submitting || eligibleEntities.length === 0}
                  className="rounded-lg bg-[#1E3D2F] px-6 py-2.5 text-sm text-white transition hover:bg-[#163024] disabled:opacity-50"
                >
                  {submitting ? 'Submitting…' : 'Submit Reviews'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
