export type ReviewEntityType = 'hotel' | 'restaurant' | 'activity';

/** Mirrors backend `Review` (v2 reviews_v2). */
export interface Review {
  id: number;
  author_user_id: number;
  trip_id: number;
  entity_type: ReviewEntityType;
  entity_id: number;
  rating: number;
  locked_at: string | null;
  deleted_at: string | null;
  comment: string | null;
  schema_version: number;
  created_at: string | null;
  updated_at: string | null;
}

/** Mirrors backend `CreateReview` request body. */
export interface CreateReview {
  trip_id: number;
  entity_type: ReviewEntityType;
  entity_id: number;
  rating: number;
  comment?: string | null;
}

/** Mirrors backend `UpdateReview` request body. */
export interface UpdateReview {
  rating?: number | null;
  comment?: string | null;
}

/** Mirrors backend `ReviewAuthor`. No avatar/display_name — compose in UI. */
export interface ReviewAuthor {
  id: number;
  first_name: string | null;
  last_name: string | null;
}

/** Mirrors backend `ReviewWithAuthor` — nested, not flat. */
export interface ReviewWithAuthor {
  review: Review;
  author: ReviewAuthor;
}

/** Mirrors backend `ReviewAggregate`. */
export interface ReviewAggregate {
  average_rating: number | null;
  review_count: number;
}

/** Mirrors backend `ReviewListResponse` (the `by-entity` endpoint). */
export interface ReviewListResponse {
  reviews: ReviewWithAuthor[];
  aggregate: ReviewAggregate;
}

export function reviewAuthorDisplayName(author: ReviewAuthor): string {
  const name = [author.first_name, author.last_name].filter(Boolean).join(' ').trim();
  return name || 'TiP Traveler';
}
