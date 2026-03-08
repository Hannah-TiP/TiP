"use client";

import { useState, useRef } from 'react';
import type { UIBlock, WidgetResponsePayload } from '@/types/ai-chat';
import type { Hotel } from '@/types/hotel';
import { getImageUrl } from '@/types/hotel';

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
      value: { hotel_id: hotel.id, hotel_name: hotel.name },
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
        {hotels.map(hotel => {
          const imageUrl = hotel.image && hotel.image.length > 0
            ? getImageUrl(hotel.image[0])
            : '/placeholder.jpg';

          return (
            <button
              key={hotel.id}
              onClick={() => handleSelect(hotel)}
              disabled={selected !== null || disabled}
              className={`flex-shrink-0 w-[240px] rounded-xl border overflow-hidden text-left transition-all
                ${selected === hotel.id
                  ? 'border-[#1E3D2F] ring-2 ring-[#1E3D2F]/20'
                  : selected !== null
                    ? 'border-gray-200 opacity-50'
                    : 'border-gray-200 hover:border-[#1E3D2F] hover:shadow-md'
                }
              `}
            >
              <div className="h-[140px] bg-gray-100 relative">
                <img
                  src={imageUrl}
                  alt={hotel.name}
                  className="w-full h-full object-cover"
                />
                {hotel.star_rating && (
                  <span className="absolute top-2 right-2 bg-white/90 rounded-full px-2 py-0.5 text-[10px] font-medium text-[#1E3D2F]">
                    {hotel.star_rating}
                  </span>
                )}
              </div>
              <div className="p-3">
                <h4 className="font-inter text-[13px] font-semibold text-[#1E3D2F] line-clamp-1">{hotel.name}</h4>
                {hotel.city?.name && (
                  <p className="font-inter text-[11px] text-gray-500 mt-0.5">{hotel.city.name}</p>
                )}
                {hotel.description && (
                  <p className="font-inter text-[11px] text-gray-400 mt-1 line-clamp-2">{hotel.description}</p>
                )}
                {hotel.review_summary && hotel.review_summary.total_reviews > 0 && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <span className="text-[11px] font-medium text-[#C4956A]">★ {hotel.review_summary.average_rating.toFixed(1)}</span>
                    <span className="text-[10px] text-gray-400">({hotel.review_summary.total_reviews})</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
