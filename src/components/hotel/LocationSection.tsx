'use client';

import type { GeoPoint } from '@/types/common';

interface LocationSectionProps {
  hotelName: string;
  description?: string;
  geo?: GeoPoint | null;
}

export default function LocationSection({ hotelName, description, geo }: LocationSectionProps) {
  // Use Google Maps embed via place query — works without an API key on the client iframe.
  const mapSrc = geo
    ? `https://www.google.com/maps?q=${geo.lat},${geo.lng}&z=15&output=embed`
    : null;

  return (
    <div>
      {description && (
        <p className="mb-4 text-[15px] leading-[1.9] text-gray-text">{description}</p>
      )}
      {mapSrc && (
        <div className="my-6 aspect-[16/9] w-full overflow-hidden border border-gray-border bg-gray-light">
          <iframe
            src={mapSrc}
            title={`${hotelName} location map`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-full w-full border-0"
            allowFullScreen
          />
        </div>
      )}
    </div>
  );
}
