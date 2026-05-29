import { cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReviewableEntity } from '@/lib/trip-utils';
import type { Review } from '@/types/review';

const createReview = vi.fn();
const updateReview = vi.fn();
const deleteReview = vi.fn();

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    createReview: (...a: unknown[]) => createReview(...a),
    updateReview: (...a: unknown[]) => updateReview(...a),
    deleteReview: (...a: unknown[]) => deleteReview(...a),
  },
}));

import { installMockLocalStorage } from '@/__tests__/helpers/mock-local-storage';
import ReviewSessionItem from '@/components/reviews/ReviewSessionItem';

installMockLocalStorage();

const entity: ReviewableEntity = { entityType: 'hotel', entityId: 10, title: 'Aman Tokyo' };

function makeReview(overrides: Partial<Review> = {}): Review {
  return {
    id: 1,
    author_user_id: 9,
    trip_id: 3,
    entity_type: 'hotel',
    entity_id: 10,
    rating: 5,
    locked_at: null,
    deleted_at: null,
    comment: 'Wonderful stay',
    schema_version: 1,
    created_at: null,
    updated_at: null,
    ...overrides,
  };
}

afterEach(cleanup);
beforeEach(() => {
  createReview.mockReset();
  updateReview.mockReset();
  deleteReview.mockReset();
  window.localStorage.clear();
});

describe('ReviewSessionItem', () => {
  it('shows the not-reviewed form and submits a new review', async () => {
    createReview.mockResolvedValue({});
    const onChanged = vi.fn();

    render(
      <ReviewSessionItem tripId={3} entity={entity} existingReview={null} onChanged={onChanged} />,
    );

    expect(screen.getByText('Not Reviewed')).toBeTruthy();

    fireEvent.click(screen.getByLabelText('Rating for Aman Tokyo: 4 stars'));
    fireEvent.change(screen.getByPlaceholderText('Share your experience at Aman Tokyo...'), {
      target: { value: 'Great' },
    });
    fireEvent.click(screen.getByText('Submit Review'));

    await waitFor(() => expect(createReview).toHaveBeenCalled());
    expect(createReview).toHaveBeenCalledWith({
      trip_id: 3,
      entity_type: 'hotel',
      entity_id: 10,
      rating: 4,
      comment: 'Great',
    });
    expect(onChanged).toHaveBeenCalled();
  });

  it('blocks submit without a rating', () => {
    render(
      <ReviewSessionItem tripId={3} entity={entity} existingReview={null} onChanged={vi.fn()} />,
    );

    fireEvent.click(screen.getByText('Submit Review'));

    expect(createReview).not.toHaveBeenCalled();
    expect(screen.getByText('Please choose a star rating.')).toBeTruthy();
  });

  it('surfaces a server rejection (e.g. verified-stay gate)', async () => {
    createReview.mockRejectedValue(new Error('You must have a completed stay to review'));

    render(
      <ReviewSessionItem tripId={3} entity={entity} existingReview={null} onChanged={vi.fn()} />,
    );

    fireEvent.click(screen.getByLabelText('Rating for Aman Tokyo: 5 stars'));
    fireEvent.click(screen.getByText('Submit Review'));

    expect(await screen.findByText('You must have a completed stay to review')).toBeTruthy();
  });

  it('renders a submitted review with Edit / Delete actions', () => {
    render(
      <ReviewSessionItem
        tripId={3}
        entity={entity}
        existingReview={makeReview()}
        onChanged={vi.fn()}
      />,
    );

    expect(screen.getByText('Submitted')).toBeTruthy();
    expect(screen.getByText('Wonderful stay')).toBeTruthy();
    expect(screen.getByText('Edit')).toBeTruthy();
    expect(screen.getByText('Delete')).toBeTruthy();
  });

  it('renders a locked review with no edit controls', () => {
    render(
      <ReviewSessionItem
        tripId={3}
        entity={entity}
        existingReview={makeReview({ locked_at: '2026-02-01T00:00:00Z' })}
        onChanged={vi.fn()}
      />,
    );

    expect(screen.getByText('Locked')).toBeTruthy();
    expect(screen.queryByText('Edit')).toBeNull();
    expect(screen.queryByText('Delete')).toBeNull();
    expect(screen.getByText(/30-day edit window has closed/)).toBeTruthy();
  });
});
