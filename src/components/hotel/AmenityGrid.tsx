'use client';

import Image from 'next/image';
import { useState } from 'react';
import Modal from '@/components/Modal';
import { useLanguage } from '@/contexts/LanguageContext';
import { getImageUrl, getLocalizedText } from '@/types/common';
import type { HotelFeature } from '@/types/hotel';

interface AmenityGridProps {
  features: HotelFeature[];
}

function hasPhotos(feature: HotelFeature): boolean {
  return (feature.images?.length ?? 0) > 0;
}

export default function AmenityGrid({ features }: AmenityGridProps) {
  const { t } = useLanguage();
  const [openFeatureIndex, setOpenFeatureIndex] = useState<number | null>(null);

  const openFeature = openFeatureIndex !== null ? features[openFeatureIndex] : null;

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {features.map((feature, index) => {
          const name = getLocalizedText(feature.name);
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
                  {feature.icon && <span className="text-[22px] text-gold">{feature.icon}</span>}
                  <span className="text-[13px] tracking-[0.5px] text-gray-text">{name}</span>
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
            >
              {feature.icon && <span className="text-[22px] text-gold">{feature.icon}</span>}
              <span className="text-[13px] tracking-[0.5px] text-gray-text">{name}</span>
            </li>
          );
        })}
      </ul>

      <Modal
        isOpen={openFeature !== null}
        onClose={() => setOpenFeatureIndex(null)}
        ariaLabel={
          openFeature
            ? `${getLocalizedText(openFeature.name)} ${t('hotel.amenity_photos_label')}`
            : undefined
        }
      >
        {openFeature && (
          <div className="p-6 pt-12">
            <h2 className="mb-6 font-primary text-2xl font-light text-green-dark">
              {getLocalizedText(openFeature.name)}
            </h2>
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
                    alt={`${getLocalizedText(openFeature.name)} ${imgIndex + 1}`}
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
