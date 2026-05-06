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
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {rooms.map((room, index) => {
        const roomImage = room.images?.[0] ? getImageUrl(room.images[0]) : fallbackImage;
        const sizeText = room.size_sqm ? `${room.size_sqm} m²` : null;
        const summary = getLocalizedText(room.summary);
        const name = getLocalizedText(room.name);
        return (
          <article
            key={`${name}-${index}`}
            className="group flex flex-col overflow-hidden border border-gray-border bg-white"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-gray-light">
              <Image
                src={roomImage}
                alt={name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="flex flex-1 flex-col px-5 py-4">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-primary text-[22px] font-light text-green-dark">{name}</h3>
                {sizeText && (
                  <span className="shrink-0 text-[11px] uppercase tracking-[0.15em] text-gold">
                    {sizeText}
                  </span>
                )}
              </div>
              {summary && (
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-text">
                  {summary}
                </p>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
