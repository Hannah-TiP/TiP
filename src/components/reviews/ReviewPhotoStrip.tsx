'use client';

import Image from 'next/image';
import type { Image as ReviewImage } from '@/types/common';
import { resolveS3Url } from '@/types/common';
import { useLanguage } from '@/contexts/LanguageContext';

interface ReviewPhotoStripProps {
  photos: ReviewImage[];
}

/**
 * Read-only thumbnail strip for a review's photos (SMA-280). Author-only
 * surface — the backend returns `photos: []` to everyone but the author.
 * Loaded via next/dynamic by its consumers (bundle-size gate) and mounted
 * only when there are photos.
 */
export default function ReviewPhotoStrip({ photos }: ReviewPhotoStripProps) {
  const { t } = useLanguage();

  return (
    <ul className="mt-3 flex flex-wrap gap-2" data-testid="review-photo-strip">
      {photos.map((photo) => {
        const url = resolveS3Url(photo.w128 || photo.w400 || photo.original);
        if (!url) return null;
        return (
          <li
            key={photo.original}
            className="relative h-16 w-16 overflow-hidden rounded-lg border border-gray-border"
          >
            <Image
              src={url}
              alt={t('reviews.photo_alt')}
              fill
              sizes="64px"
              className="object-cover"
            />
          </li>
        );
      })}
    </ul>
  );
}
