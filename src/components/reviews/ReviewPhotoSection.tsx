'use client';

import { useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import type { Image as ReviewImage } from '@/types/common';
import { resolveS3Url } from '@/types/common';
import type { ReviewEntityType } from '@/types/review';
import { REVIEW_PHOTO_HEIC_UNSUPPORTED_CODE } from '@/types/review';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  MAX_REVIEW_PHOTOS,
  uploadReviewPhoto,
  validateReviewPhotoFile,
  type ReviewPhotoValidationError,
} from '@/lib/review-photo-upload';

type TranslationKey = Parameters<ReturnType<typeof useLanguage>['t']>[0];

const VALIDATION_ERROR_KEY: Record<ReviewPhotoValidationError, TranslationKey> = {
  heic: 'reviews.photo_error_heic',
  type: 'reviews.photo_error_type',
  size: 'reviews.photo_error_size',
  limit: 'reviews.photo_error_limit',
};

interface PendingPhoto {
  id: number;
  /** Kept so a failed upload can be retried. Null for validation rejects. */
  file: File | null;
  name: string;
  progress: number;
  status: 'uploading' | 'error';
  message: string | null;
}

export interface ReviewPhotoSectionProps {
  tripId: number;
  entityType: ReviewEntityType;
  entityId: number;
  /** Finalized photos (controlled by the session page). */
  photos: ReviewImage[];
  onAddPhoto: (image: ReviewImage) => void;
  onRemovePhoto: (originalKey: string) => void;
  disabled: boolean;
}

let nextPendingId = 1;

/**
 * Photo attach UI for the review write/edit surface (SMA-280): file picking
 * with client-side pre-checks, direct-to-S3 upload with per-file progress,
 * retry on failure, and removal before submit. Loaded via next/dynamic —
 * keep it out of the shared bundle.
 */
export default function ReviewPhotoSection({
  tripId,
  entityType,
  entityId,
  photos,
  onAddPhoto,
  onRemovePhoto,
  disabled,
}: ReviewPhotoSectionProps) {
  const { t, lang } = useLanguage();
  const [pending, setPending] = useState<PendingPhoto[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  // Live count across async callbacks (parallel uploads + controlled prop).
  const countRef = useRef(0);
  countRef.current = photos.length + pending.filter((p) => p.status === 'uploading').length;

  const patchPending = useCallback((id: number, patch: Partial<PendingPhoto>) => {
    setPending((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }, []);

  const startUpload = useCallback(
    async (id: number, file: File) => {
      patchPending(id, { status: 'uploading', progress: 0, message: null });
      try {
        const image = await uploadReviewPhoto({
          file,
          tripId,
          entityType,
          entityId,
          language: lang,
          onProgress: (fraction) => patchPending(id, { progress: fraction }),
        });
        setPending((prev) => prev.filter((p) => p.id !== id));
        onAddPhoto(image);
      } catch (err) {
        // 4005 fallback: the backend couldn't finalize a HEIC upload — show
        // its localized convert-to-JPEG message.
        const heic =
          err instanceof Error &&
          (err as { code?: number | null }).code === REVIEW_PHOTO_HEIC_UNSUPPORTED_CODE;
        patchPending(id, {
          status: 'error',
          message: heic && err.message ? err.message : t('reviews.photo_error_upload'),
        });
      }
    },
    [patchPending, tripId, entityType, entityId, lang, onAddPhoto, t],
  );

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      for (const file of Array.from(files)) {
        const validationError = validateReviewPhotoFile(file, countRef.current);
        const id = nextPendingId++;
        if (validationError) {
          setPending((prev) => [
            ...prev,
            {
              id,
              file: null,
              name: file.name,
              progress: 0,
              status: 'error',
              message: t(VALIDATION_ERROR_KEY[validationError]),
            },
          ]);
          continue;
        }
        countRef.current += 1;
        setPending((prev) => [
          ...prev,
          { id, file, name: file.name, progress: 0, status: 'uploading', message: null },
        ]);
        startUpload(id, file);
      }
      if (inputRef.current) inputRef.current.value = '';
    },
    [startUpload, t],
  );

  const atCapacity = photos.length + pending.length >= MAX_REVIEW_PHOTOS;

  return (
    <div className="mb-4" data-testid="review-photo-section">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-gray-700">{t('reviews.photos_label')}</p>
        <p className="text-xs text-gray-400">{t('reviews.photos_hint')}</p>
      </div>

      {(photos.length > 0 || pending.length > 0) && (
        <ul className="mb-3 flex flex-wrap gap-2">
          {photos.map((photo) => {
            const url = resolveS3Url(photo.w128 || photo.w400 || photo.original);
            return (
              <li
                key={photo.original}
                className="relative h-20 w-20 overflow-hidden rounded-lg border border-gray-200"
                data-testid="review-photo-thumb"
              >
                {url && (
                  <Image
                    src={url}
                    alt={t('reviews.photo_alt')}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                )}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => onRemovePhoto(photo.original)}
                    aria-label={t('reviews.photo_remove')}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs leading-none text-white hover:bg-black/80"
                  >
                    ×
                  </button>
                )}
              </li>
            );
          })}
          {pending.map((item) => (
            <li
              key={item.id}
              className={`flex w-40 flex-col justify-between gap-1 rounded-lg border p-2 text-xs ${
                item.status === 'error' ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'
              }`}
              data-testid={
                item.status === 'error' ? 'review-photo-error' : 'review-photo-uploading'
              }
            >
              <span className="truncate text-gray-600" title={item.name}>
                {item.name}
              </span>
              {item.status === 'uploading' ? (
                <div>
                  <p className="mb-1 text-[10px] text-gray-400">{t('reviews.photo_uploading')}</p>
                  <div className="h-1 w-full overflow-hidden rounded bg-gray-200">
                    <div
                      className="h-full bg-[#1E3D2F] transition-all"
                      style={{ width: `${Math.round(item.progress * 100)}%` }}
                      role="progressbar"
                      aria-valuenow={Math.round(item.progress * 100)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                </div>
              ) : (
                <>
                  {item.message && <p className="text-[10px] text-red-600">{item.message}</p>}
                  <div className="flex items-center gap-2">
                    {item.file && (
                      <button
                        type="button"
                        onClick={() => item.file && startUpload(item.id, item.file)}
                        className="font-medium text-[#1E3D2F] hover:underline"
                      >
                        {t('reviews.photo_retry')}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setPending((prev) => prev.filter((p) => p.id !== item.id))}
                      className="text-gray-500 hover:underline"
                    >
                      {t('reviews.photo_remove')}
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,.jpg,.jpeg,.png"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        data-testid="review-photo-input"
        aria-label={t('reviews.photo_add')}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || atCapacity}
        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-[#1E3D2F] hover:text-[#1E3D2F] disabled:opacity-50"
      >
        {t('reviews.photo_add')}
      </button>
    </div>
  );
}
