'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import {
  reviewAuthorDisplayName,
  visibleReviewPhotos,
  type ReviewEntityType,
  type ReviewListResponse,
  type ReviewWithAuthor,
} from '@/types/review';
import StarRating from '@/components/reviews/StarRating';
import { lazy, Suspense } from 'react';

// Code-split (bundle-size gate): the strip chunk loads only when a review
// actually has author-visible photos. React.lazy (not next/dynamic) — the
// strip only mounts client-side after the reviews fetch, and next/dynamic's
// loader machinery would be duplicated into every route chunk using this
// component.
const ReviewPhotoStrip = lazy(() => import('@/components/reviews/ReviewPhotoStrip'));
import { useLanguage, type Lang } from '@/contexts/LanguageContext';
import { formatDate } from '@/lib/format-date';

const PAGE_SIZE = 5;

interface EntityReviewsProps {
  entityType: ReviewEntityType;
  entityId: number;
}

function formatReviewDate(dateStr: string | null, lang: Lang): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return formatDate(d, lang, { year: 'numeric', month: 'long', day: 'numeric' });
}

function ReviewItem({ entry }: { entry: ReviewWithAuthor }) {
  const { t, lang } = useLanguage();
  const { review, author } = entry;
  const submittedAt = formatReviewDate(review.created_at, lang);
  // Photos are author-only this release (SMA-280 Q2) — the backend returns
  // [] unless the viewer authored this review.
  const photos = visibleReviewPhotos(review).map((p) => p.image);

  return (
    <li className="border-b border-gray-border py-6 last:border-b-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="text-[15px] font-semibold text-green-dark">
            {reviewAuthorDisplayName(author)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-green-dark/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-dark">
            {t('reviews.verified_stay')}
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
      {photos.length > 0 && (
        <Suspense fallback={null}>
          <ReviewPhotoStrip photos={photos} />
        </Suspense>
      )}
    </li>
  );
}

export default function EntityReviews({ entityType, entityId }: EntityReviewsProps) {
  const { t, lang } = useLanguage();
  const [data, setData] = useState<ReviewListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setHasError(false);
      const result = await apiClient.getReviewsByEntity(entityType, entityId, lang);
      setData(result);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [entityType, entityId, lang]);

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

  if (hasError) {
    return <p className="text-[14px] text-gray-text">{t('reviews.load_error')}</p>;
  }

  const aggregate = data?.aggregate ?? { average_rating: null, review_count: 0 };
  const reviews = data?.reviews ?? [];

  if (reviews.length === 0) {
    return (
      <div className="border border-gray-border bg-white p-8 text-center">
        <p className="font-primary text-[22px] italic text-green-dark">{t('reviews.none_title')}</p>
        <p className="mt-3 text-[14px] leading-relaxed text-gray-text">
          {t('reviews.none_subtitle')}
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
            <StarRating value={Math.round(average)} size="md" label={t('reviews.average_rating')} />
          )}
          <p className="mt-1 text-[13px] text-gray-text">
            {aggregate.review_count}{' '}
            {aggregate.review_count === 1
              ? t('reviews.verified_review_one')
              : t('reviews.verified_review_other')}
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
            {t('reviews.load_more')}
          </button>
        </div>
      )}
    </div>
  );
}
