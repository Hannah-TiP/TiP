'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Footer from '@/components/Footer';
import ReviewSessionItem from '@/components/reviews/ReviewSessionItem';
import { apiClient } from '@/lib/api-client';
import {
  getTripReviewableItems,
  getTripWithVersion,
  toReviewableEntities,
  type ReviewableEntity,
  type TripWithVersion,
} from '@/lib/trip-utils';
import { loadDrafts } from '@/lib/review-drafts';
import type { Review } from '@/types/review';

interface SessionState {
  trip: TripWithVersion;
  entities: ReviewableEntity[];
  userId: number;
  /** Map of "entityType:entityId" -> the current user's existing review. */
  reviewsByEntity: Record<string, Review | null>;
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

export default function ReviewsPage() {
  const { id } = useParams<{ id: string }>();
  const tripId = Number(id);
  const [state, setState] = useState<SessionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!tripId) return;
    try {
      setError(null);
      const [trip, user] = await Promise.all([getTripWithVersion(tripId), apiClient.getProfile()]);
      const entities = toReviewableEntities(getTripReviewableItems(trip.currentVersion));
      const reviews = await Promise.all(entities.map((e) => findUserReview(e, user.id)));
      const reviewsByEntity: Record<string, Review | null> = {};
      entities.forEach((e, i) => {
        reviewsByEntity[entityKey(e)] = reviews[i];
      });
      setState({ trip, entities, userId: user.id, reviewsByEntity });
    } catch {
      setError('Failed to load trip details.');
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    load();
  }, [load]);

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
  const drafts = loadDrafts(tripId);
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
          <div className="space-y-5">
            {entities.map((entity) => {
              const key = entityKey(entity);
              const existing = reviewsByEntity[key] ?? null;
              // Item with a saved draft but no submitted review re-mounts when
              // the draft state needs to surface; keyed on entity + review id.
              return (
                <ReviewSessionItem
                  key={`${key}:${(existing?.id ?? drafts[key]) ? 'd' : 'n'}`}
                  tripId={tripId}
                  entity={entity}
                  existingReview={existing}
                  onChanged={load}
                />
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
