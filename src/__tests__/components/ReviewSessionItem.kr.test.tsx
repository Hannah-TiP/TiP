import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import kr from '@/translations/kr.json';
import type { ReviewableEntity } from '@/lib/trip-utils';
import type { Review } from '@/types/review';
import ReviewSessionItem from '@/components/reviews/ReviewSessionItem';

const krCatalog = kr as Record<string, string>;

// Force the active UI language to KR (overrides the global en mock).
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    lang: 'kr' as const,
    setLang: vi.fn(),
    t: (key: string) => krCatalog[key] ?? key,
  }),
  LanguageProvider: ({ children }: { children: React.ReactNode }) => children,
}));

afterEach(cleanup);

const entity: ReviewableEntity = { entityType: 'hotel', entityId: 10, title: 'Aman Tokyo' };

function makeReview(overrides: Partial<Review> = {}): Review {
  return {
    id: 1,
    author_user_id: 9,
    trip_id: 3,
    entity_type: 'hotel',
    entity_id: 10,
    rating: 5,
    moderation_status: 'visible',
    locked_at: null,
    deleted_at: null,
    comment: '멋진 숙박',
    photos: [],
    schema_version: 1,
    created_at: null,
    updated_at: null,
    ...overrides,
  };
}

function renderWith(existingReview: Review) {
  return render(
    <ReviewSessionItem
      entity={entity}
      tripId={3}
      existingReview={existingReview}
      value={{ rating: 5, comment: '멋진 숙박', skipped: false, photos: [] }}
      onRatingChange={vi.fn()}
      onCommentChange={vi.fn()}
      onAddPhoto={vi.fn()}
      onRemovePhoto={vi.fn()}
      onSkipToggle={vi.fn()}
      onDelete={vi.fn()}
      isDeleting={false}
      error={null}
    />,
  );
}

describe('ReviewSessionItem (KR — SMA-328 pending approval)', () => {
  it('renders the pending pill and points notice in Korean with no missing-key fallbacks', () => {
    renderWith(makeReview({ moderation_status: 'pending' }));
    expect(screen.getByText('검토 중')).toBeTruthy();
    expect(screen.getByTestId('review-pending-notice').textContent).toBe(
      '후기를 검토 중입니다. 승인되면 포인트가 적립됩니다.',
    );
    expect(screen.queryByText('reviews.status_pending')).toBeNull();
    expect(screen.queryByText('reviews.pending_points_notice')).toBeNull();
  });

  it('renders an approved review with the Korean submitted pill and no notice', () => {
    renderWith(makeReview());
    expect(screen.getByText('제출됨')).toBeTruthy();
    expect(screen.queryByText('검토 중')).toBeNull();
    expect(screen.queryByTestId('review-pending-notice')).toBeNull();
  });
});
