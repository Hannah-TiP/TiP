'use client';

import Image from 'next/image';
import { getImageUrl, getLocalizedText } from '@/types/common';
import type { HotelRoom } from '@/types/hotel';

interface RoomGridProps {
  rooms: HotelRoom[];
  fallbackImage: string;
}

export default function RoomGrid({ rooms, fallbackImage }: RoomGridProps) {
  return (
    <div className="grid grid-cols-1 gap-1 md:grid-cols-2">
      {rooms.map((room, index) => {
        const roomImage = room.images?.[0] ? getImageUrl(room.images[0]) : fallbackImage;
        const sizeText = room.size_sqm ? `${room.size_sqm} m²` : null;
        const summary = getLocalizedText(room.summary);
        const subtitle = [sizeText, summary].filter(Boolean).join(' · ');
        return (
          <article
            key={`${getLocalizedText(room.name)}-${index}`}
            className="group relative aspect-[4/3] overflow-hidden bg-gray-light"
          >
            <Image
              src={roomImage}
              alt={getLocalizedText(room.name)}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-5 text-white">
              <h3 className="font-primary text-[22px] font-light">{getLocalizedText(room.name)}</h3>
              {subtitle && <p className="mt-1 text-[12px] text-white/70">{subtitle}</p>}
            </div>
          </article>
        );
      })}
    </div>
  );
}
