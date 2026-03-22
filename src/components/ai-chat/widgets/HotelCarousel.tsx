'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import type { UIBlock, WidgetResponsePayload } from '@/types/ai-chat';
import { getLocalizedText } from '@/types/common';
import type { Hotel } from '@/types/hotel';
import { getHotelImages } from '@/types/hotel';

interface Props {
  block: UIBlock;
  onSubmit: (payload: WidgetResponsePayload) => void;
  disabled?: boolean;
}

export default function HotelCarousel({ block, onSubmit, disabled }: Props) {
  const config = block.config as { hotels: Hotel[] };
  const hotels = config.hotels || [];
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<number | null>(null);

  const handleSelect = (hotel: Hotel) => {
    if (selected !== null || disabled) return;
    setSelected(hotel.id);
    onSubmit({
      widget_id: block.id,
      widget_type: 'hotel_carousel',
      value: { hotel_id: hotel.id, hotel_name: getLocalizedText(hotel.name) },
    });
  };

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -260 : 260, behavior: 'smooth' });
  };

  if (hotels.length === 0) return null;

  return (
    <div className="mt-3 relative">
      {/* Scroll buttons */}
      {hotels.length > 2 && (
        <>
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md text-[#1E3D2F] hover:bg-gray-50"
          >
            ←
          </button>
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md text-[#1E3D2F] hover:bg-gray-50"
          >
            →
          </button>
        </>
      )}

      {/* Cards */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scroll-smooth px-1 py-1 scrollbar-hide"
        style={{ scrollbarWidth: 'none' }}
      >
        {hotels.map((hotel) => {
          const imageUrl = getHotelImages(hotel)[0];

          return (
            <button
              key={hotel.id}
              onClick={() => handleSelect(hotel)}
              disabled={selected !== null || disabled}
              className={`flex-shrink-0 w-[240px] rounded-xl border overflow-hidden text-left transition-all
                ${
                  selected === hotel.id
                    ? 'border-[#1E3D2F] ring-2 ring-[#1E3D2F]/20'
                    : selected !== null
                      ? 'border-gray-200 opacity-50'
                      : 'border-gray-200 hover:border-[#1E3D2F] hover:shadow-md'
                }
              `}
            >
              <div className="h-[140px] bg-gray-100 relative">
                <Image
                  src={imageUrl}
                  alt={getLocalizedText(hotel.name)}
                  fill
                  sizes="240px"
                  className="object-cover"
                />
                {hotel.star_rating && (
                  <span className="absolute top-2 right-2 bg-white/90 rounded-full px-2 py-0.5 text-[10px] font-medium text-[#1E3D2F]">
                    {hotel.star_rating}
                  </span>
                )}
              </div>
              <div className="p-3">
                <h4 className="font-inter text-[13px] font-semibold text-[#1E3D2F] line-clamp-1">
                  {getLocalizedText(hotel.name)}
                </h4>
                {hotel.address && (
                  <p className="font-inter text-[11px] text-gray-500 mt-0.5">
                    {getLocalizedText(hotel.address)}
                  </p>
                )}
                {hotel.overview && (
                  <p className="font-inter text-[11px] text-gray-400 mt-1 line-clamp-2">
                    {getLocalizedText(hotel.overview)}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
