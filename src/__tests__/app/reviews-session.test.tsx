import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReviewListResponse, ReviewWithAuthor } from '@/types/review';
import type { TripWithVersion } from '@/lib/trip-utils';

const getTripWithVersion = vi.fn();
const getProfile = vi.fn();
const getReviewsByEntity = vi.fn();

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
    deleteReview: vi.fn(),
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

function reviewFor(entityType: 'hotel' | 'restaurant', entityId: number): ReviewWithAuthor {
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
    },
    author: { id: 9, first_name: 'Ada', last_name: 'L' },
  };
}

const emptyList: ReviewListResponse = {
  reviews: [],
  aggregate: { average_rating: null, review_count: 0 },
};

afterEach(cleanup);
beforeEach(() => {
  getTripWithVersion.mockReset();
  getProfile.mockReset();
  getReviewsByEntity.mockReset();
  window.localStorage.clear();
});

describe('Review session page', () => {
  it('renders each reviewable item by status (submitted vs not-reviewed)', async () => {
    getTripWithVersion.mockResolvedValue(tripWithVersion);
    getProfile.mockResolvedValue({ id: 9 });
    // Hotel reviewed by the current user; restaurant not reviewed.
    getReviewsByEntity.mockImplementation((type: string, entityId: number) => {
      if (type === 'hotel' && entityId === 10) {
        return Promise.resolve({
          reviews: [reviewFor('hotel', 10)],
          aggregate: { average_rating: 5, review_count: 1 },
        });
      }
      return Promise.resolve(emptyList);
    });

    render(<ReviewsPage />);

    expect(await screen.findByText('Aman Tokyo')).toBeTruthy();
    expect(screen.getByText('Narisawa')).toBeTruthy();
    expect(screen.getByText('Submitted')).toBeTruthy();
    expect(screen.getByText('Not Reviewed')).toBeTruthy();
    // Progress reflects 1 of 2 reviewed.
    expect(screen.getByText('1 of 2 reviewed')).toBeTruthy();
  });

  it('shows an empty state when the trip has no TiP-backed items', async () => {
    getTripWithVersion.mockResolvedValue({
      ...tripWithVersion,
      currentVersion: { ...tripWithVersion.currentVersion!, plan: [] },
    });
    getProfile.mockResolvedValue({ id: 9 });

    render(<ReviewsPage />);

    await waitFor(() =>
      expect(screen.getByText(/no TiP-listed hotels, restaurants, or activities/i)).toBeTruthy(),
    );
  });
});
