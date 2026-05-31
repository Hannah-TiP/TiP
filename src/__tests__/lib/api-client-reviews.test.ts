import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/lib/api-client';
import type { ReviewListResponse, ReviewWithAuthor } from '@/types/review';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function mockResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  };
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe('ApiClient review methods', () => {
  it('getReviewsByEntity calls the public by-entity endpoint and unwraps data', async () => {
    const list: ReviewListResponse = {
      reviews: [],
      aggregate: { average_rating: 4.5, review_count: 2 },
    };
    mockFetch.mockResolvedValueOnce(mockResponse({ data: list }));

    const result = await apiClient.getReviewsByEntity('hotel', 7);

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/reviews/by-entity/hotel/7',
      expect.objectContaining({ credentials: 'include' }),
    );
    expect(result).toEqual(list);
  });

  it('createReview POSTs the CreateReview body and unwraps ReviewWithAuthor', async () => {
    const created: ReviewWithAuthor = {
      review: {
        id: 1,
        author_user_id: 9,
        trip_id: 3,
        entity_type: 'restaurant',
        entity_id: 12,
        rating: 5,
        locked_at: null,
        deleted_at: null,
        comment: 'Lovely',
        schema_version: 1,
        created_at: null,
        updated_at: null,
      },
      author: { id: 9, first_name: 'Ada', last_name: 'Lovelace' },
    };
    mockFetch.mockResolvedValueOnce(mockResponse({ data: created }));

    const result = await apiClient.createReview({
      trip_id: 3,
      entity_type: 'restaurant',
      entity_id: 12,
      rating: 5,
      comment: 'Lovely',
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/reviews',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          trip_id: 3,
          entity_type: 'restaurant',
          entity_id: 12,
          rating: 5,
          comment: 'Lovely',
        }),
      }),
    );
    expect(result).toEqual(created);
  });

  it('updateReview PUTs to /reviews/:id', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: { review: {}, author: {} } }));

    await apiClient.updateReview(42, { rating: 4, comment: null });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/reviews/42',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ rating: 4, comment: null }),
      }),
    );
  });

  it('deleteReview DELETEs /reviews/:id', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: null }));

    await apiClient.deleteReview(99);

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/reviews/99',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('surfaces the backend error message on a duplicate (409)', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ message: 'You have already reviewed this item' }, 409),
    );

    await expect(
      apiClient.createReview({ trip_id: 1, entity_type: 'hotel', entity_id: 2, rating: 5 }),
    ).rejects.toThrow('You have already reviewed this item');
  });
});
