'use client';

import Image from 'next/image';
import { useState } from 'react';
import Modal from '@/components/Modal';
import { useLanguage } from '@/contexts/LanguageContext';
import { resolveAmenityIcon } from '@/lib/amenity-icon';
import { getImageUrl, getLocalizedText } from '@/types/common';
import type { HotelFeature } from '@/types/hotel';

interface AmenityGridProps {
  features: HotelFeature[];
}

function hasPhotos(feature: HotelFeature): boolean {
  return (feature.images?.length ?? 0) > 0;
}

function AmenityIcon({ icon }: { icon?: string | null }) {
  const resolved = resolveAmenityIcon(icon);
  if (!resolved) return null;
  if (resolved.kind === 'lucide') {
    // Inline fontSize: lucide.css ships an UNLAYERED `[class^="icon-"] { font-size: inherit }`
    // rule that beats Tailwind v4's @layer utilities, so `text-[22px]` alone is overridden
    // and the glyph would inherit the tile's 16px. Inline style wins the cascade.
    return (
      <span className="icon-lucide text-gold" style={{ fontSize: '22px' }} aria-hidden="true">
        {resolved.char}
      </span>
    );
  }
  return <span className="text-[22px] text-gold">{resolved.char}</span>;
}

export default function AmenityGrid({ features }: AmenityGridProps) {
  const { t, lang } = useLanguage();
  const [openFeatureIndex, setOpenFeatureIndex] = useState<number | null>(null);

  const openFeature = openFeatureIndex !== null ? features[openFeatureIndex] : null;

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {features.map((feature, index) => {
          const name = getLocalizedText(feature.name, lang);
          const description = getLocalizedText(feature.description, lang);
          const photoBearing = hasPhotos(feature);

          if (photoBearing) {
            return (
              <li key={`${feature.feature_type}-${index}`}>
                <button
                  type="button"
                  onClick={() => setOpenFeatureIndex(index)}
                  className="flex w-full flex-col items-center gap-2 border border-gray-border bg-white px-3 py-5 text-center transition-colors hover:border-gold hover:bg-gray-light"
                  data-testid={`amenity-photo-button-${index}`}
                >
                  <AmenityIcon icon={feature.icon} />
                  <span className="text-[13px] tracking-[0.5px] text-gray-text">{name}</span>
                  {description && (
                    <span className="line-clamp-2 text-[11px] text-gray-text">{description}</span>
                  )}
                  <span className="text-[11px] tracking-[0.5px] uppercase text-gold">
                    {t('hotel.amenity_view_photos')}
                  </span>
                </button>
              </li>
            );
          }

          return (
            <li
              key={`${feature.feature_type}-${index}`}
              className="flex flex-col items-center gap-2 border border-gray-border bg-white px-3 py-5 text-center"
              title={description || undefined}
            >
              <AmenityIcon icon={feature.icon} />
              <span className="text-[13px] tracking-[0.5px] text-gray-text">{name}</span>
              {description && (
                <span className="line-clamp-2 text-[11px] text-gray-text">{description}</span>
              )}
            </li>
          );
        })}
      </ul>

      <Modal
        isOpen={openFeature !== null}
        onClose={() => setOpenFeatureIndex(null)}
        ariaLabel={
          openFeature
            ? `${getLocalizedText(openFeature.name, lang)} ${t('hotel.amenity_photos_label')}`
            : undefined
        }
      >
        {openFeature && (
          <div className="p-6 pt-12">
            <h2 className="mb-6 font-primary text-2xl font-light text-green-dark">
              {getLocalizedText(openFeature.name, lang)}
            </h2>
            {getLocalizedText(openFeature.description, lang) && (
              <p className="mb-6 text-sm text-gray-text">
                {getLocalizedText(openFeature.description, lang)}
              </p>
            )}
            <div
              className={
                openFeature.images!.length === 1 ? '' : 'grid grid-cols-1 gap-4 md:grid-cols-2'
              }
            >
              {openFeature.images!.map((image, imgIndex) => (
                <div
                  key={imgIndex}
                  className="relative aspect-[4/3] overflow-hidden rounded-lg bg-gray-light"
                >
                  <Image
                    src={getImageUrl(image)}
                    alt={`${getLocalizedText(openFeature.name, lang)} ${imgIndex + 1}`}
                    fill
                    sizes={
                      openFeature.images!.length === 1
                        ? '(max-width: 768px) 100vw, 800px'
                        : '(max-width: 768px) 100vw, 400px'
                    }
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
