'use client';

import { getLocalizedText } from '@/types/common';
import type { HotelFeature } from '@/types/hotel';

interface AmenityGridProps {
  features: HotelFeature[];
}

export default function AmenityGrid({ features }: AmenityGridProps) {
  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {features.map((feature, index) => (
        <li
          key={`${feature.feature_type}-${index}`}
          className="flex flex-col items-center gap-2 border border-gray-border bg-white px-3 py-5 text-center"
        >
          {feature.icon && <span className="text-[22px] text-gold">{feature.icon}</span>}
          <span className="text-[13px] tracking-[0.5px] text-gray-text">
            {getLocalizedText(feature.name)}
          </span>
        </li>
      ))}
    </ul>
  );
}
