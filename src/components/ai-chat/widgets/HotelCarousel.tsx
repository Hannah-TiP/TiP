'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { AIChatHotelCarouselWidget, AIChatWidgetResponse } from '@/types/ai-chat';
import { getImageUrl } from '@/types/common';

interface Props {
  widget: AIChatHotelCarouselWidget;
  onSubmit: (response: AIChatWidgetResponse) => void;
  disabled?: boolean;
}

export default function HotelCarousel({ widget, onSubmit, disabled }: Props) {
  const hotels = widget.hotels ?? [];
  const [selectedId, setSelectedId] = useState<number | null>(null);

  function handleSelect(hotel: { id: number; name: string | null }) {
    if (disabled || selectedId !== null) return;
    setSelectedId(hotel.id);
    onSubmit({
      widget_id: widget.widget_id,
      widget_type: 'hotel_carousel',
      value: { hotel_id: hotel.id, name: hotel.name },
    });
  }

  if (hotels.length === 0) return null;

  return (
    <div className="mt-3 border border-gray-200 rounded-lg p-3 bg-white">
      <p className="font-inter text-xs text-gray-500 mb-3">Select a hotel</p>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {hotels.map((hotel) => {
          const isSelected = selectedId === hotel.id;
          return (
            <button
              type="button"
              key={hotel.id}
              onClick={() => handleSelect({ id: hotel.id, name: hotel.name })}
              disabled={disabled || selectedId !== null}
              className={`shrink-0 w-44 text-left rounded-lg overflow-hidden border transition-all disabled:opacity-60 ${
                isSelected ? 'border-[#1E3D2F] ring-2 ring-[#1E3D2F]' : 'border-gray-200'
              }`}
              data-testid={`hotel-card-${hotel.id}`}
            >
              <div className="relative w-full h-24 bg-gray-100">
                {hotel.image_url && (
                  <Image
                    src={getImageUrl(hotel.image_url)}
                    alt={hotel.name ?? `Hotel ${hotel.id}`}
                    fill
                    sizes="176px"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="p-2">
                <p className="font-inter text-xs font-medium text-[#1E3D2F] line-clamp-2">
                  {hotel.name ?? `Hotel ${hotel.id}`}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
