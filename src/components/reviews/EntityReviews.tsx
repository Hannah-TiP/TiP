'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import {
  reviewAuthorDisplayName,
  type ReviewEntityType,
  type ReviewListResponse,
  type ReviewWithAuthor,
} from '@/types/review';
import StarRating from '@/components/reviews/StarRating';

const PAGE_SIZE = 5;

interface EntityReviewsProps {
  entityType: ReviewEntityType;
  entityId: number;
}

function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function ReviewItem({ entry }: { entry: ReviewWithAuthor }) {
  const { review, author } = entry;
  const submittedAt = formatDate(review.created_at);

  return (
    <li className="border-b border-gray-border py-6 last:border-b-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="text-[15px] font-semibold text-green-dark">
            {reviewAuthorDisplayName(author)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-green-dark/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-dark">
            Verified stay
          </span>
        </div>
        {submittedAt && <span className="text-[12px] text-gray-text">{submittedAt}</span>}
      </div>
      <div className="mt-2">
        <StarRating value={review.rating} size="sm" />
      </div>
      {review.comment && (
        <p className="mt-3 text-[14px] leading-relaxed text-gray-text">{review.comment}</p>
      )}
    </li>
  );
}

export default function EntityReviews({ entityType, entityId }: EntityReviewsProps) {
  const [data, setData] = useState<ReviewListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await apiClient.getReviewsByEntity(entityType, entityId);
      setData(result);
    } catch {
      setError('Unable to load reviews right now.');
    } finally {
      setIsLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    if (!entityId) return;
    load();
  }, [entityId, load]);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4" data-testid="entity-reviews-loading">
        <div className="h-8 w-40 rounded bg-gray-200" />
        <div className="h-20 rounded bg-gray-100" />
        <div className="h-20 rounded bg-gray-100" />
      </div>
    );
  }

  if (error) {
    return <p className="text-[14px] text-gray-text">{error}</p>;
  }

  const aggregate = data?.aggregate ?? { average_rating: null, review_count: 0 };
  const reviews = data?.reviews ?? [];

  if (reviews.length === 0) {
    return (
      <div className="border border-gray-border bg-white p-8 text-center">
        <p className="font-primary text-[22px] italic text-green-dark">No reviews yet</p>
        <p className="mt-3 text-[14px] leading-relaxed text-gray-text">
          Be the first to share your experience after your stay.
        </p>
      </div>
    );
  }

  const visible = reviews.slice(0, visibleCount);
  const hasMore = visibleCount < reviews.length;
  const average = aggregate.average_rating;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-4 border-b border-gray-border pb-6">
        <span className="font-primary text-[44px] font-light leading-none text-green-dark">
          {average !== null ? average.toFixed(1) : '—'}
        </span>
        <div>
          {average !== null && (
            <StarRating value={Math.round(average)} size="md" label="Average rating" />
          )}
          <p className="mt-1 text-[13px] text-gray-text">
            {aggregate.review_count}{' '}
            {aggregate.review_count === 1 ? 'verified review' : 'verified reviews'}
          </p>
        </div>
      </div>

      <ul>
        {visible.map((entry) => (
          <ReviewItem key={entry.review.id} entry={entry} />
        ))}
      </ul>

      {hasMore && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="rounded-full border border-green-dark px-6 py-2.5 text-[13px] font-semibold text-green-dark transition-colors hover:bg-green-dark hover:text-white"
          >
            Load more reviews
          </button>
        </div>
      )}
    </div>
  );
}
