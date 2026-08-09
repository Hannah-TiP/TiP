import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReviewableEntity } from '@/lib/trip-utils';
import type { Review } from '@/types/review';
import ReviewSessionItem, { type ReviewItemValue } from '@/components/reviews/ReviewSessionItem';

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
    photos: [],
    schema_version: 1,
    created_at: null,
    updated_at: null,
    ...overrides,
  };
}

const emptyValue: ReviewItemValue = { rating: 0, comment: '', skipped: false, photos: [] };

function renderItem(props: Partial<React.ComponentProps<typeof ReviewSessionItem>> = {}) {
  return render(
    <ReviewSessionItem
      entity={entity}
      tripId={3}
      existingReview={null}
      value={emptyValue}
      onRatingChange={vi.fn()}
      onCommentChange={vi.fn()}
      onAddPhoto={vi.fn()}
      onRemovePhoto={vi.fn()}
      onSkipToggle={vi.fn()}
      onDelete={vi.fn()}
      isDeleting={false}
      error={null}
      {...props}
    />,
  );
}

afterEach(cleanup);

describe('ReviewSessionItem', () => {
  it('has no per-item submit/save button', () => {
    renderItem();
    expect(screen.queryByText('Submit Review')).toBeNull();
    expect(screen.queryByText('Save Changes')).toBeNull();
  });

  it('emits rating and comment changes (controlled)', () => {
    const onRatingChange = vi.fn();
    const onCommentChange = vi.fn();
    renderItem({ onRatingChange, onCommentChange });

    fireEvent.click(screen.getByLabelText('Rating for Aman Tokyo: 4 stars'));
    expect(onRatingChange).toHaveBeenCalledWith(4);

    fireEvent.change(screen.getByPlaceholderText('Share your experience at Aman Tokyo...'), {
      target: { value: 'Great' },
    });
    expect(onCommentChange).toHaveBeenCalledWith('Great');
  });

  it('shows a Skip toggle and an Unskip + Skipped pill when skipped', () => {
    const onSkipToggle = vi.fn();
    const { rerender } = renderItem({ onSkipToggle });

    const skipBtn = screen.getByText('Skip');
    fireEvent.click(skipBtn);
    expect(onSkipToggle).toHaveBeenCalled();

    rerender(
      <ReviewSessionItem
        entity={entity}
        tripId={3}
        existingReview={null}
        value={{ ...emptyValue, skipped: true }}
        onRatingChange={vi.fn()}
        onCommentChange={vi.fn()}
        onAddPhoto={vi.fn()}
        onRemovePhoto={vi.fn()}
        onSkipToggle={onSkipToggle}
        onDelete={vi.fn()}
        isDeleting={false}
        error={null}
      />,
    );
    expect(screen.getByText('Unskip')).toBeTruthy();
    expect(screen.getByText('Skipped')).toBeTruthy();
  });

  it('renders an existing review as an editable form with a Delete control', () => {
    const onDelete = vi.fn();
    renderItem({
      existingReview: makeReview(),
      value: { rating: 5, comment: 'Wonderful stay', skipped: false, photos: [] },
      onDelete,
    });

    expect(screen.getByText('Submitted')).toBeTruthy();
    // Pre-seeded form (editable inline) — no separate "Edit" step needed.
    expect(
      (screen.getByPlaceholderText(/Share your experience/) as HTMLTextAreaElement).value,
    ).toBe('Wonderful stay');
    const del = screen.getByText('Delete');
    fireEvent.click(del);
    expect(onDelete).toHaveBeenCalled();
    expect(screen.queryByText('Submit Review')).toBeNull();
    expect(screen.queryByText('Save Changes')).toBeNull();
  });

  it('renders a locked review read-only with no controls', () => {
    renderItem({
      existingReview: makeReview({ locked_at: '2026-02-01T00:00:00Z' }),
      value: { rating: 5, comment: 'Wonderful stay', skipped: false, photos: [] },
    });

    expect(screen.getByText('Locked')).toBeTruthy();
    expect(screen.queryByText('Delete')).toBeNull();
    expect(screen.queryByText('Skip')).toBeNull();
    expect(screen.queryByRole('radiogroup')).toBeNull();
    expect(screen.getByText(/30-day edit window has closed/)).toBeTruthy();
  });

  it('surfaces a per-item error', () => {
    renderItem({ error: 'You must have a completed stay to review' });
    expect(screen.getByText('You must have a completed stay to review')).toBeTruthy();
  });
});
