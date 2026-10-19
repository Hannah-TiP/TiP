'use client';

import Image from 'next/image';
import type { Image as ReviewImage } from '@/types/common';
import { resolveS3Url } from '@/types/common';
import { useLanguage } from '@/contexts/LanguageContext';

interface ReviewPhotoStripProps {
  photos: ReviewImage[];
}

/**
 * Read-only thumbnail strip for a review's photos (SMA-280, public since
 * SMA-643). Review photos are public: the backend strips admin-hidden photos
 * server-side for non-authors, while the author's own copy carries `hidden`
 * (consumers filter via `visibleReviewPhotos()`). Each thumbnail links to the
 * large variant in a new tab — a plain link, no lightbox, to keep the chunk
 * tiny. Loaded via next/dynamic by its consumers (bundle-size gate) and
 * mounted only when there are photos.
 */
export default function ReviewPhotoStrip({ photos }: ReviewPhotoStripProps) {
  const { t } = useLanguage();

  return (
    <ul className="mt-3 flex flex-wrap gap-2" data-testid="review-photo-strip">
      {photos.map((photo) => {
        const url = resolveS3Url(photo.w128 || photo.w400 || photo.original);
        if (!url) return null;
        const fullUrl = resolveS3Url(photo.w1200 || photo.original) || url;
        return (
          <li key={photo.original}>
            <a
              href={fullUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('reviews.photo_view_full')}
              data-testid="review-photo-link"
              className="relative block h-16 w-16 overflow-hidden rounded-lg border border-gray-border focus:outline-none focus-visible:ring-2 focus-visible:ring-green-dark focus-visible:ring-offset-2"
            >
              <Image
                src={url}
                alt={t('reviews.photo_alt')}
                fill
                sizes="64px"
                className="object-cover"
              />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
