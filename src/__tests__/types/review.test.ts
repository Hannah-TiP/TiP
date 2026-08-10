import { describe, it, expect } from 'vitest';
import { formatRatingBadge, formatReviewSummary, type ReviewAggregate } from '@/types/review';

describe('formatRatingBadge', () => {
  it('formats the average to one decimal when there are reviews', () => {
    const aggregate: ReviewAggregate = { average_rating: 4.5, review_count: 12 };
    expect(formatRatingBadge(aggregate)).toBe('4.5');
  });

  it('rounds the average to one decimal', () => {
    const aggregate: ReviewAggregate = { average_rating: 4.26, review_count: 3 };
    expect(formatRatingBadge(aggregate)).toBe('4.3');
  });

  it('returns null when the aggregate is missing (no reviews)', () => {
    expect(formatRatingBadge(undefined)).toBeNull();
  });

  it('returns null when review_count is zero', () => {
    const aggregate: ReviewAggregate = { average_rating: null, review_count: 0 };
    expect(formatRatingBadge(aggregate)).toBeNull();
  });

  it('returns null when average_rating is null despite a count', () => {
    const aggregate: ReviewAggregate = { average_rating: null, review_count: 0 };
    expect(formatRatingBadge(aggregate)).toBeNull();
  });
});

describe('formatReviewSummary', () => {
  it('builds the full summary string with pluralized "reviews"', () => {
    const aggregate: ReviewAggregate = { average_rating: 4.5, review_count: 12 };
    expect(formatReviewSummary(aggregate)).toBe('4.5 ★ (12 reviews)');
  });

  it('uses the singular "review" for a single review', () => {
    const aggregate: ReviewAggregate = { average_rating: 5.0, review_count: 1 };
    expect(formatReviewSummary(aggregate)).toBe('5.0 ★ (1 review)');
  });

  it('returns null when there are no reviews', () => {
    expect(formatReviewSummary(undefined)).toBeNull();
    expect(formatReviewSummary({ average_rating: null, review_count: 0 })).toBeNull();
  });
});

describe('review photo helpers (SMA-280)', () => {
  const img = (original: string) => ({ original });

  it('visibleReviewPhotos filters admin-hidden photos and tolerates missing photos', async () => {
    const { visibleReviewPhotos } = await import('@/types/review');
    const review = {
      photos: [
        { image: img('reviews/media/1/a.jpg'), hidden: false },
        { image: img('reviews/media/1/b.jpg'), hidden: true },
      ],
    } as never;
    expect(visibleReviewPhotos(review).map((p) => p.image.original)).toEqual([
      'reviews/media/1/a.jpg',
    ]);
    expect(visibleReviewPhotos({} as never)).toEqual([]);
  });

  it('reviewPhotoImagesEqual compares by original key, order-sensitively', async () => {
    const { reviewPhotoImagesEqual } = await import('@/types/review');
    expect(reviewPhotoImagesEqual([img('a')], [img('a')])).toBe(true);
    expect(reviewPhotoImagesEqual([img('a'), img('b')], [img('b'), img('a')])).toBe(false);
    expect(reviewPhotoImagesEqual([img('a')], [img('a'), img('b')])).toBe(false);
    expect(reviewPhotoImagesEqual([], [])).toBe(true);
  });

  it('ReviewPhotoFinalizeError carries the backend business code', async () => {
    const { ReviewPhotoFinalizeError, REVIEW_PHOTO_HEIC_UNSUPPORTED_CODE } =
      await import('@/types/review');
    expect(new ReviewPhotoFinalizeError('x', 4005).code).toBe(REVIEW_PHOTO_HEIC_UNSUPPORTED_CODE);
    expect(new ReviewPhotoFinalizeError('x', null).code).toBeNull();
    expect(new ReviewPhotoFinalizeError('x', 4005)).toBeInstanceOf(Error);
  });
});
