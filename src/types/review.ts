import type { Image } from '@/types/common';

export type ReviewEntityType = 'hotel' | 'restaurant' | 'activity';

/**
 * Mirrors backend `ReviewPhoto` (SMA-280) — a traveller photo attached to a
 * review. `hidden` is per-photo admin moderation state (Q3).
 */
export interface ReviewPhoto {
  image: Image;
  hidden: boolean;
}

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
  /** Populated only for the author's own reviews — `[]` for everyone else (Q2). */
  photos: ReviewPhoto[];
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
  /** Finalized photo Images (from `/reviews/photos/finalize`). */
  photos?: Image[];
}

/** Mirrors backend `UpdateReview` request body. */
export interface UpdateReview {
  rating?: number | null;
  comment?: string | null;
  /** When provided, REPLACES the photo list. Omit to leave photos untouched. */
  photos?: Image[];
}

/** Mirrors backend `ReviewPhotoUploadCredentialsRequest` (SMA-280). */
export interface ReviewPhotoUploadCredentialsRequest {
  trip_id: number;
  entity_type: ReviewEntityType;
  entity_id: number;
  content_type: string;
}

/** Mirrors backend `ReviewPhotoUploadRestrictions`. */
export interface ReviewPhotoUploadRestrictions {
  max_file_size_bytes: number;
  allowed_content_types: string[];
  expiry_minutes: number;
}

/** Mirrors backend `ReviewPhotoUploadCredentials` — presigned POST to S3. */
export interface ReviewPhotoUploadCredentials {
  upload_url: string;
  form_data: Record<string, string>;
  upload_key: string;
  bucket: string;
  region: string;
  restrictions: ReviewPhotoUploadRestrictions;
}

/** Backend business code for "HEIC can't be finalized — convert to JPEG". */
export const REVIEW_PHOTO_HEIC_UNSUPPORTED_CODE = 4005;

/**
 * Thrown by `apiClient.finalizeReviewPhoto` so callers can branch on the
 * backend business `code` (4005 = HEIC unsupported) while keeping the
 * server's localized message.
 */
export class ReviewPhotoFinalizeError extends Error {
  readonly code: number | null;

  constructor(message: string, code: number | null) {
    super(message);
    this.name = 'ReviewPhotoFinalizeError';
    this.code = code;
  }
}

/** The author-visible (non-hidden) photos of a review. */
export function visibleReviewPhotos(review: Review): ReviewPhoto[] {
  return (review.photos ?? []).filter((photo) => !photo.hidden);
}

/** Order-sensitive equality of two finalized photo lists (by `original` key). */
export function reviewPhotoImagesEqual(a: Image[], b: Image[]): boolean {
  return a.length === b.length && a.every((image, i) => image.original === b[i].original);
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

/**
 * Returns the short badge label for an aggregate (e.g. "4.5") when the entity
 * has at least one visible review, or `null` when it has none / no aggregate.
 */
export function formatRatingBadge(aggregate: ReviewAggregate | undefined): string | null {
  if (!aggregate || aggregate.review_count <= 0 || aggregate.average_rating === null) {
    return null;
  }
  return aggregate.average_rating.toFixed(1);
}

/**
 * Returns the InfoWindow review summary (e.g. "4.5 ★ (12 reviews)") when the
 * entity has at least one visible review, or `null` otherwise.
 */
export function formatReviewSummary(aggregate: ReviewAggregate | undefined): string | null {
  const badge = formatRatingBadge(aggregate);
  if (badge === null || !aggregate) return null;
  const count = aggregate.review_count;
  const noun = count === 1 ? 'review' : 'reviews';
  return `${badge} ★ (${count} ${noun})`;
}
