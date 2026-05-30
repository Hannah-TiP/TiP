'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import type { ReviewAggregate, ReviewEntityType } from '@/types/review';

interface EntityRatingBadgeProps {
  entityType: ReviewEntityType;
  entityId: number;
  className?: string;
}

/**
 * Compact average-rating chip for listing cards. Fetches the entity's review
 * aggregate (the `by-entity` endpoint is public and returns the aggregate)
 * and renders nothing when the entity has no reviews, so cards stay clean.
 */
export default function EntityRatingBadge({
  entityType,
  entityId,
  className = '',
}: EntityRatingBadgeProps) {
  const [aggregate, setAggregate] = useState<ReviewAggregate | null>(null);

  useEffect(() => {
    let active = true;
    if (!entityId) return;
    apiClient
      .getReviewsByEntity(entityType, entityId)
      .then((res) => {
        if (active) setAggregate(res.aggregate);
      })
      .catch(() => {
        if (active) setAggregate(null);
      });
    return () => {
      active = false;
    };
  }, [entityType, entityId]);

  if (!aggregate || aggregate.review_count === 0 || aggregate.average_rating === null) {
    return null;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 text-[12px] font-semibold text-green-dark ${className}`}
      aria-label={`${aggregate.average_rating.toFixed(1)} out of 5 from ${aggregate.review_count} reviews`}
    >
      <span className="text-yellow-500">&#9733;</span>
      <span>{aggregate.average_rating.toFixed(1)}</span>
      <span className="font-normal text-gray-text">({aggregate.review_count})</span>
    </span>
  );
}
