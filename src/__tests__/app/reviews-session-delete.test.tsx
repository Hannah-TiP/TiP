import { cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReviewListResponse, ReviewWithAuthor } from '@/types/review';
import type { PointsLedgerResponse, PointTransaction } from '@/types/stay-credit';
import type { TripWithVersion } from '@/lib/trip-utils';

// Deleting an APPROVED review claws back its review reward (SMA-363): the
// session page must confirm first, quoting the unconsumed remainder from the
// wallet, and degrade to figure-free copy when the ledger can't tell.

const getTripWithVersion = vi.fn();
const getProfile = vi.fn();
const getReviewsByEntity = vi.fn();
const deleteReview = vi.fn();
const getMyPoints = vi.fn();

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: '3' }),
}));

vi.mock('@/components/Footer', () => ({ default: () => <div>Footer</div> }));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    getProfile: (...a: unknown[]) => getProfile(...a),
    getReviewsByEntity: (...a: unknown[]) => getReviewsByEntity(...a),
    createReview: vi.fn(),
    updateReview: vi.fn(),
    deleteReview: (...a: unknown[]) => deleteReview(...a),
    getMyPoints: (...a: unknown[]) => getMyPoints(...a),
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
        items: [{ item_type: 'hotel', hotel_id: 10, title: 'Aman Tokyo' }],
      },
    ],
  },
  activeQuote: null,
};

function hotelReview(overrides: Partial<ReviewWithAuthor['review']> = {}): ReviewListResponse {
  const review: ReviewWithAuthor = {
    review: {
      id: 10,
      author_user_id: 9,
      trip_id: 3,
      entity_type: 'hotel',
      entity_id: 10,
      rating: 5,
      moderation_status: 'visible',
      locked_at: null,
      deleted_at: null,
      comment: 'Loved it',
      photos: [],
      schema_version: 1,
      created_at: null,
      updated_at: null,
      ...overrides,
    },
    author: { id: 9, first_name: 'Ada', last_name: 'L' },
  };
  return { reviews: [review], aggregate: { average_rating: 5, review_count: 1 } };
}

function ledgerRow(overrides: Partial<PointTransaction> & { id: number }): PointTransaction {
  return {
    user_id: 9,
    source: 'review_reward',
    status: 'issued',
    kind: 'grant',
    delta_points: 500,
    trip_id: 3,
    ...overrides,
  };
}

function ledger(transactions: PointTransaction[]): PointsLedgerResponse {
  return { user_id: 9, balance_points: 0, transactions };
}

afterEach(cleanup);
beforeEach(() => {
  getTripWithVersion.mockReset();
  getProfile.mockReset();
  getReviewsByEntity.mockReset();
  deleteReview.mockReset();
  getMyPoints.mockReset();
  window.localStorage.clear();
  getTripWithVersion.mockResolvedValue(tripWithVersion);
  getProfile.mockResolvedValue({ id: 9 });
  deleteReview.mockResolvedValue(undefined);
});

async function openDeleteConfirm() {
  render(<ReviewsPage />);
  await screen.findByText('Aman Tokyo');
  fireEvent.click(screen.getByText('Delete'));
  return screen.findByTestId('delete-review-confirm');
}

describe('Deleting a review from the session page (SMA-363)', () => {
  it('quotes the unconsumed review reward before deleting an approved review', async () => {
    getReviewsByEntity.mockResolvedValue(hotelReview());
    getMyPoints.mockResolvedValue(
      ledger([
        ledgerRow({ id: 1, delta_points: 1000, notes: 'photo' }),
        ledgerRow({ id: 2, kind: 'use', delta_points: -300, consumes_transaction_id: 1 }),
      ]),
    );

    await openDeleteConfirm();

    // The wallet is fetched lazily, on confirm open — never on page load.
    expect(getMyPoints).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(screen.getByTestId('delete-review-confirm-message').textContent).toBe(
        'Deleting this review removes the 700 P you earned for it.',
      ),
    );
    // Nothing is deleted until the member confirms.
    expect(deleteReview).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('delete-review-confirm-submit'));
    await waitFor(() => expect(deleteReview).toHaveBeenCalledWith(10, 'en'));
    await waitFor(() => expect(screen.queryByTestId('delete-review-confirm')).toBeNull());
  });

  it('falls back to figure-free copy when the wallet fetch fails', async () => {
    getReviewsByEntity.mockResolvedValue(hotelReview());
    getMyPoints.mockRejectedValue(new Error('network'));

    await openDeleteConfirm();

    await waitFor(() =>
      expect(screen.getByTestId('delete-review-confirm-message').textContent).toBe(
        'Deleting this review removes the points you earned for it.',
      ),
    );
    fireEvent.click(screen.getByTestId('delete-review-confirm-submit'));
    await waitFor(() => expect(deleteReview).toHaveBeenCalledWith(10, 'en'));
  });

  it('falls back to figure-free copy when the trip has no reward row', async () => {
    getReviewsByEntity.mockResolvedValue(hotelReview());
    // A reward for a DIFFERENT trip must not be quoted.
    getMyPoints.mockResolvedValue(ledger([ledgerRow({ id: 1, trip_id: 77 })]));

    await openDeleteConfirm();

    await waitFor(() =>
      expect(screen.getByTestId('delete-review-confirm-message').textContent).toBe(
        'Deleting this review removes the points you earned for it.',
      ),
    );
  });

  it('keeps the review (and the points) when the member cancels', async () => {
    getReviewsByEntity.mockResolvedValue(hotelReview());
    getMyPoints.mockResolvedValue(ledger([ledgerRow({ id: 1 })]));

    await openDeleteConfirm();
    await screen.findByText('Deleting this review removes the 500 P you earned for it.');

    fireEvent.click(screen.getByText('Keep review'));
    await waitFor(() => expect(screen.queryByTestId('delete-review-confirm')).toBeNull());
    expect(deleteReview).not.toHaveBeenCalled();
  });

  it('deletes a pending review straight away — no reward has been granted yet', async () => {
    getReviewsByEntity.mockResolvedValue(hotelReview({ moderation_status: 'pending' }));

    render(<ReviewsPage />);
    await screen.findByText('Aman Tokyo');
    fireEvent.click(screen.getByText('Delete'));

    await waitFor(() => expect(deleteReview).toHaveBeenCalledWith(10, 'en'));
    expect(screen.queryByTestId('delete-review-confirm')).toBeNull();
    expect(getMyPoints).not.toHaveBeenCalled();
  });
});
