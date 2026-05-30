import { cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReviewListResponse, ReviewWithAuthor } from '@/types/review';
import type { TripWithVersion } from '@/lib/trip-utils';

const getTripWithVersion = vi.fn();
const getProfile = vi.fn();
const getReviewsByEntity = vi.fn();
const createReview = vi.fn();
const updateReview = vi.fn();
const deleteReview = vi.fn();

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: '3' }),
}));

vi.mock('@/components/Footer', () => ({ default: () => <div>Footer</div> }));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    getProfile: (...a: unknown[]) => getProfile(...a),
    getReviewsByEntity: (...a: unknown[]) => getReviewsByEntity(...a),
    createReview: (...a: unknown[]) => createReview(...a),
    updateReview: (...a: unknown[]) => updateReview(...a),
    deleteReview: (...a: unknown[]) => deleteReview(...a),
  },
}));

vi.mock('@/lib/trip-utils', async () => {
  const actual = await vi.importActual<typeof import('@/lib/trip-utils')>('@/lib/trip-utils');
  return {
    ...actual,
    getTripWithVersion: (...a: unknown[]) => getTripWithVersion(...a),
  };
});

import { installMockLocalStorage } from '@/__tests__/helpers/mock-local-storage';
import ReviewsPage from '@/app/my-page/travel-history/[id]/reviews/page';

installMockLocalStorage();

const tripWithVersion: TripWithVersion = {
  trip: { id: 3, user_id: 9, status: 'travel-completed', schema_version: 1 },
  currentVersion: {
    id: 1,
    trip_id: 3,
    title: 'Tokyo, Japan',
    adults: 2,
    kids: 0,
    schema_version: 1,
    plan: [
      {
        date: '2026-01-01',
        items: [
          { item_type: 'hotel', hotel_id: 10, title: 'Aman Tokyo' },
          { item_type: 'restaurant', restaurant_id: 20, title: 'Narisawa' },
        ],
      },
    ],
  },
  activeQuote: null,
};

function reviewFor(
  entityType: 'hotel' | 'restaurant',
  entityId: number,
  overrides: Partial<ReviewWithAuthor['review']> = {},
): ReviewWithAuthor {
  return {
    review: {
      id: entityId,
      author_user_id: 9,
      trip_id: 3,
      entity_type: entityType,
      entity_id: entityId,
      rating: 5,
      locked_at: null,
      deleted_at: null,
      comment: 'Loved it',
      schema_version: 1,
      created_at: null,
      updated_at: null,
      ...overrides,
    },
    author: { id: 9, first_name: 'Ada', last_name: 'L' },
  };
}

const emptyList: ReviewListResponse = {
  reviews: [],
  aggregate: { average_rating: null, review_count: 0 },
};

function listWith(review: ReviewWithAuthor | null): ReviewListResponse {
  return review
    ? { reviews: [review], aggregate: { average_rating: review.review.rating, review_count: 1 } }
    : emptyList;
}

afterEach(cleanup);
beforeEach(() => {
  getTripWithVersion.mockReset();
  getProfile.mockReset();
  getReviewsByEntity.mockReset();
  createReview.mockReset();
  updateReview.mockReset();
  deleteReview.mockReset();
  window.localStorage.clear();
  getTripWithVersion.mockResolvedValue(tripWithVersion);
  getProfile.mockResolvedValue({ id: 9 });
});

describe('Review session page', () => {
  it('renders each reviewable item by status and the single submit button', async () => {
    getReviewsByEntity.mockImplementation((type: string, entityId: number) =>
      Promise.resolve(
        listWith(type === 'hotel' && entityId === 10 ? reviewFor('hotel', 10) : null),
      ),
    );

    render(<ReviewsPage />);

    expect(await screen.findByText('Aman Tokyo')).toBeTruthy();
    expect(screen.getByText('Narisawa')).toBeTruthy();
    expect(screen.getByText('Submitted')).toBeTruthy();
    expect(screen.getByText('Not Reviewed')).toBeTruthy();
    expect(screen.getByText('1 of 2 reviewed')).toBeTruthy();
    // Exactly one trip-level submit button.
    expect(screen.getAllByText('Submit Reviews')).toHaveLength(1);
    expect(screen.queryByText('Submit Review')).toBeNull();
  });

  it('trip-level submit creates a new review for each filled item', async () => {
    getReviewsByEntity.mockResolvedValue(emptyList);
    createReview.mockResolvedValue({});

    render(<ReviewsPage />);
    await screen.findByText('Aman Tokyo');

    fireEvent.click(screen.getByLabelText('Rating for Aman Tokyo: 4 stars'));
    fireEvent.click(screen.getByLabelText('Rating for Narisawa: 5 stars'));
    fireEvent.click(screen.getByText('Submit Reviews'));

    await waitFor(() => expect(createReview).toHaveBeenCalledTimes(2));
    expect(createReview).toHaveBeenCalledWith({
      trip_id: 3,
      entity_type: 'hotel',
      entity_id: 10,
      rating: 4,
      comment: null,
    });
    expect(await screen.findByText(/2 reviews submitted/)).toBeTruthy();
  });

  it('excludes a skipped item from the batch submit and persists the skip', async () => {
    getReviewsByEntity.mockResolvedValue(emptyList);
    createReview.mockResolvedValue({});

    const { unmount } = render(<ReviewsPage />);
    await screen.findByText('Aman Tokyo');

    fireEvent.click(screen.getByLabelText('Rating for Aman Tokyo: 4 stars'));
    fireEvent.click(screen.getByLabelText('Rating for Narisawa: 5 stars'));
    // Skip the restaurant.
    const skipButtons = screen.getAllByText('Skip');
    fireEvent.click(skipButtons[1]);
    expect(screen.getByText('Unskip')).toBeTruthy();

    fireEvent.click(screen.getByText('Submit Reviews'));

    await waitFor(() => expect(createReview).toHaveBeenCalledTimes(1));
    expect(createReview).toHaveBeenCalledWith(
      expect.objectContaining({ entity_type: 'hotel', entity_id: 10 }),
    );

    // Skip persisted across remount.
    unmount();
    render(<ReviewsPage />);
    await screen.findByText('Narisawa');
    expect(screen.getByText('Unskip')).toBeTruthy();
  });

  it('excludes a locked review from submit', async () => {
    getReviewsByEntity.mockImplementation((type: string, entityId: number) => {
      if (type === 'hotel' && entityId === 10) {
        return Promise.resolve(
          listWith(reviewFor('hotel', 10, { locked_at: '2026-02-01T00:00:00Z' })),
        );
      }
      return Promise.resolve(emptyList);
    });
    createReview.mockResolvedValue({});

    render(<ReviewsPage />);
    await screen.findByText('Aman Tokyo');

    expect(screen.getByText('Locked')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Rating for Narisawa: 5 stars'));
    fireEvent.click(screen.getByText('Submit Reviews'));

    await waitFor(() => expect(createReview).toHaveBeenCalledTimes(1));
    expect(createReview).toHaveBeenCalledWith(
      expect.objectContaining({ entity_type: 'restaurant', entity_id: 20 }),
    );
  });

  it('updates an edited existing review on submit', async () => {
    getReviewsByEntity.mockImplementation((type: string, entityId: number) =>
      Promise.resolve(
        listWith(type === 'hotel' && entityId === 10 ? reviewFor('hotel', 10) : null),
      ),
    );
    updateReview.mockResolvedValue({});

    render(<ReviewsPage />);
    await screen.findByText('Aman Tokyo');

    // Change the hotel rating from 5 to 3 (edited) and submit.
    fireEvent.click(screen.getByLabelText('Rating for Aman Tokyo: 3 stars'));
    fireEvent.click(screen.getByText('Submit Reviews'));

    await waitFor(() => expect(updateReview).toHaveBeenCalledTimes(1));
    expect(updateReview).toHaveBeenCalledWith(10, { rating: 3, comment: 'Loved it' });
    expect(createReview).not.toHaveBeenCalled();
  });

  it('persists a draft when a rating is set without submitting', async () => {
    getReviewsByEntity.mockResolvedValue(emptyList);

    const { unmount } = render(<ReviewsPage />);
    await screen.findByText('Aman Tokyo');

    fireEvent.click(screen.getByLabelText('Rating for Aman Tokyo: 4 stars'));
    expect(window.localStorage.getItem('tip-review-drafts:3')).toContain('hotel:10');

    // Draft re-seeds across remount.
    unmount();
    render(<ReviewsPage />);
    await screen.findByText('Aman Tokyo');
    expect(
      screen.getByLabelText('Rating for Aman Tokyo: 4 stars').getAttribute('aria-checked'),
    ).toBe('true');
  });

  it('surfaces a per-item failure after submit', async () => {
    getReviewsByEntity.mockResolvedValue(emptyList);
    createReview.mockRejectedValue(new Error('You must have a completed stay to review'));

    render(<ReviewsPage />);
    await screen.findByText('Aman Tokyo');

    fireEvent.click(screen.getByLabelText('Rating for Aman Tokyo: 4 stars'));
    fireEvent.click(screen.getByText('Submit Reviews'));

    expect(await screen.findByText('You must have a completed stay to review')).toBeTruthy();
    expect(screen.getByText(/Couldn’t submit: Aman Tokyo/)).toBeTruthy();
  });

  it('shows an empty state when the trip has no TiP-backed items', async () => {
    getTripWithVersion.mockResolvedValue({
      ...tripWithVersion,
      currentVersion: { ...tripWithVersion.currentVersion!, plan: [] },
    });

    render(<ReviewsPage />);

    await waitFor(() =>
      expect(screen.getByText(/no TiP-listed hotels, restaurants, or activities/i)).toBeTruthy(),
    );
  });
});
