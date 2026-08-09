import { apiClient } from '@/lib/api-client';
import type { Image } from '@/types/common';
import type { Lang } from '@/contexts/LanguageContext';
import type { ReviewEntityType, ReviewPhotoUploadCredentials } from '@/types/review';

/** Client-side mirrors of the server limits (Q4) — server remains the enforcement. */
export const MAX_REVIEW_PHOTOS = 20;
export const MAX_REVIEW_PHOTO_BYTES = 10 * 1024 * 1024;

/** Types the client will actually upload. HEIC is rejected up-front (the
 * backend cannot finalize it — business code 4005). */
export const UPLOADABLE_REVIEW_PHOTO_TYPES = ['image/jpeg', 'image/png'];

export type ReviewPhotoValidationError = 'heic' | 'type' | 'size' | 'limit';

export function isHeicFile(file: Pick<File, 'name' | 'type'>): boolean {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return (
    name.endsWith('.heic') ||
    name.endsWith('.heif') ||
    type === 'image/heic' ||
    type === 'image/heif'
  );
}

/**
 * Pre-upload validation mirroring the server limits. Returns the failure
 * kind, or `null` when the file may be uploaded. `currentCount` is the number
 * of photos already attached or uploading for this review.
 */
export function validateReviewPhotoFile(
  file: Pick<File, 'name' | 'type' | 'size'>,
  currentCount: number,
): ReviewPhotoValidationError | null {
  if (currentCount >= MAX_REVIEW_PHOTOS) return 'limit';
  if (isHeicFile(file)) return 'heic';
  if (!UPLOADABLE_REVIEW_PHOTO_TYPES.includes(file.type.toLowerCase())) return 'type';
  if (file.size > MAX_REVIEW_PHOTO_BYTES) return 'size';
  return null;
}

/**
 * POST the file directly to S3 via the presigned POST. The policy fields are
 * appended VERBATIM (they already include the exact Content-Type the policy
 * enforces) and the file goes LAST — S3 ignores fields after it.
 * Uses XHR so per-file upload progress can be reported (fetch cannot).
 */
export function postReviewPhotoToS3(
  credentials: ReviewPhotoUploadCredentials,
  file: File,
  onProgress?: (fraction: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    Object.entries(credentials.form_data).forEach(([key, value]) => {
      form.append(key, value);
    });
    form.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', credentials.upload_url);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(event.total > 0 ? event.loaded / event.total : 0);
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`S3 upload failed with status ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error('S3 upload failed'));
    xhr.onabort = () => reject(new Error('S3 upload aborted'));
    xhr.send(form);
  });
}

export interface UploadReviewPhotoParams {
  file: File;
  tripId: number;
  entityType: ReviewEntityType;
  entityId: number;
  language?: Lang;
  onProgress?: (fraction: number) => void;
}

/**
 * Full upload pipeline for one review photo: credentials → direct S3 POST →
 * finalize. Resolves the finalized `Image` (original + width variants).
 * Throws `ReviewPhotoFinalizeError` (with the backend business code) when
 * finalize rejects, or a plain `Error` for credential/S3 failures.
 */
export async function uploadReviewPhoto({
  file,
  tripId,
  entityType,
  entityId,
  language,
  onProgress,
}: UploadReviewPhotoParams): Promise<Image> {
  const credentials = await apiClient.getReviewPhotoUploadCredentials(
    {
      trip_id: tripId,
      entity_type: entityType,
      entity_id: entityId,
      content_type: file.type.toLowerCase(),
    },
    language,
  );
  await postReviewPhotoToS3(credentials, file, onProgress);
  return apiClient.finalizeReviewPhoto(credentials.upload_key, language);
}
