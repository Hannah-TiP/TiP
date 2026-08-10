import { cleanup, render, screen, waitFor, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReviewListResponse, ReviewWithAuthor } from '@/types/review';

const getReviewsByEntity = vi.fn();

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    getReviewsByEntity: (...args: unknown[]) => getReviewsByEntity(...args),
  },
}));

import EntityReviews from '@/components/reviews/EntityReviews';

function makeReview(id: number, rating: number): ReviewWithAuthor {
  return {
    review: {
      id,
      author_user_id: id,
      trip_id: 1,
      entity_type: 'hotel',
      entity_id: 10,
      rating,
      locked_at: null,
      deleted_at: null,
      comment: `Comment ${id}`,
      photos: [],
      schema_version: 1,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: null,
    },
    author: { id, first_name: `User${id}`, last_name: null },
  };
}

afterEach(cleanup);
beforeEach(() => getReviewsByEntity.mockReset());

describe('EntityReviews', () => {
  it('shows a loading skeleton before data resolves', async () => {
    let resolve!: (v: ReviewListResponse) => void;
    getReviewsByEntity.mockReturnValue(
      new Promise<ReviewListResponse>((r) => {
        resolve = r;
      }),
    );
    render(<EntityReviews entityType="hotel" entityId={10} />);

    expect(screen.getByTestId('entity-reviews-loading')).toBeTruthy();

    // Resolve so the pending fetch settles and teardown isn't left hanging.
    resolve({ reviews: [], aggregate: { average_rating: null, review_count: 0 } });
    await waitFor(() => expect(screen.queryByTestId('entity-reviews-loading')).toBeNull());
  });

  it('renders an empty state when there are no reviews', async () => {
    const empty: ReviewListResponse = {
      reviews: [],
      aggregate: { average_rating: null, review_count: 0 },
    };
    getReviewsByEntity.mockResolvedValue(empty);

    render(<EntityReviews entityType="hotel" entityId={10} />);

    expect(await screen.findByText('No reviews yet')).toBeTruthy();
  });

  it('renders aggregate, verified labels, and the review list', async () => {
    const data: ReviewListResponse = {
      reviews: [makeReview(1, 5), makeReview(2, 4)],
      aggregate: { average_rating: 4.5, review_count: 2 },
    };
    getReviewsByEntity.mockResolvedValue(data);

    render(<EntityReviews entityType="hotel" entityId={10} />);

    expect(await screen.findByText('4.5')).toBeTruthy();
    expect(screen.getByText('2 verified reviews')).toBeTruthy();
    expect(screen.getAllByText('Verified stay')).toHaveLength(2);
    expect(screen.getByText('Comment 1')).toBeTruthy();
  });

  it('paginates client-side via Load more', async () => {
    const reviews = Array.from({ length: 7 }, (_, i) => makeReview(i + 1, 5));
    getReviewsByEntity.mockResolvedValue({
      reviews,
      aggregate: { average_rating: 5, review_count: 7 },
    });

    render(<EntityReviews entityType="hotel" entityId={10} />);

    // First page shows 5.
    expect(await screen.findByText('Comment 5')).toBeTruthy();
    expect(screen.queryByText('Comment 6')).toBeNull();

    fireEvent.click(screen.getByText('Load more reviews'));

    await waitFor(() => expect(screen.getByText('Comment 7')).toBeTruthy());
    expect(screen.queryByText('Load more reviews')).toBeNull();
  });

  it("renders the author's own photos (non-hidden only) and no strip otherwise (SMA-280)", async () => {
    const own = makeReview(1, 5);
    own.review.photos = [
      {
        image: { original: 'reviews/media/1/a.jpg', w128: 'reviews/media/1/a_w128.jpg' },
        hidden: false,
      },
      { image: { original: 'reviews/media/1/b.jpg' }, hidden: true },
    ];
    const other = makeReview(2, 4); // backend returns [] for non-authors
    getReviewsByEntity.mockResolvedValue({
      reviews: [own, other],
      aggregate: { average_rating: 4.5, review_count: 2 },
    });
    vi.stubEnv('NEXT_PUBLIC_S3_ENDPOINT', 'https://bucket.s3.amazonaws.com');

    render(<EntityReviews entityType="hotel" entityId={10} />);

    await screen.findByText('Comment 1');
    // The strip is next/dynamic-loaded — wait for the chunk to resolve.
    const strips = await screen.findAllByTestId('review-photo-strip');
    // Only the author's review gets a strip, with the hidden photo filtered.
    expect(strips).toHaveLength(1);
    expect(strips[0].querySelectorAll('img')).toHaveLength(1);
  });
});
