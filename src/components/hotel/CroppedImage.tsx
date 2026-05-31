'use client';

import Image from 'next/image';
import type { CropRect } from '@/types/common';

interface CroppedImageProps {
  src: string;
  alt: string;
  crop?: CropRect | null;
  sizes?: string;
  priority?: boolean;
  className?: string;
}

/**
 * Renders an image inside a fill container. When a normalized crop rectangle
 * is provided, the underlying image is scaled and offset so only the cropped
 * region is visible — non-destructively, at render time. When `crop` is
 * absent (or degenerate), the image renders full-frame (object-cover), exactly
 * matching the previous behavior for legacy/un-cropped images.
 */
export default function CroppedImage({
  src,
  alt,
  crop,
  sizes,
  priority,
  className = 'object-cover',
}: CroppedImageProps) {
  const hasCrop = !!crop && crop.width > 0 && crop.height > 0;

  if (!hasCrop) {
    return (
      <Image src={src} alt={alt} fill sizes={sizes} className={className} priority={priority} />
    );
  }

  const { x, y, width, height } = crop;
  const style = {
    width: `${100 / width}%`,
    height: `${100 / height}%`,
    left: `${(-x * 100) / width}%`,
    top: `${(-y * 100) / height}%`,
  } as const;

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute" style={style} data-testid="cropped-image-frame">
        <Image src={src} alt={alt} fill sizes={sizes} className={className} priority={priority} />
      </div>
    </div>
  );
}
