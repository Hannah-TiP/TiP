'use client';

import { useState } from 'react';
import type { AIChatHotelCarouselWidget, AIChatWidgetResponse } from '@/types/ai-chat';

interface Props {
  widget: AIChatHotelCarouselWidget;
  onSubmit: (response: AIChatWidgetResponse) => void;
  disabled?: boolean;
}

export default function HotelCarousel({ widget, onSubmit, disabled }: Props) {
  const hotelIds = widget.hotel_ids ?? [];
  const [selectedId, setSelectedId] = useState<number | null>(null);

  function handleSelect(hotelId: number) {
    if (disabled || selectedId !== null) return;
    setSelectedId(hotelId);
    onSubmit({
      widget_id: widget.widget_id,
      widget_type: 'hotel_carousel',
      value: { hotel_id: hotelId },
    });
  }

  if (hotelIds.length === 0) return null;

  return (
    <div className="mt-3 border border-gray-200 rounded-lg p-3 bg-white">
      <p className="font-inter text-xs text-gray-500 mb-3">Select a hotel</p>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {hotelIds.map((hotelId) => {
          const isSelected = selectedId === hotelId;
          return (
            <button
              type="button"
              key={hotelId}
              onClick={() => handleSelect(hotelId)}
              disabled={disabled || selectedId !== null}
              className={`shrink-0 w-44 text-left rounded-lg overflow-hidden border transition-all disabled:opacity-60 ${
                isSelected ? 'border-[#1E3D2F] ring-2 ring-[#1E3D2F]' : 'border-gray-200'
              }`}
              data-testid={`hotel-card-${hotelId}`}
            >
              <div className="relative w-full h-24 bg-gray-100" />
              <div className="p-2">
                <p className="font-inter text-xs font-medium text-[#1E3D2F] line-clamp-2">
                  Hotel {hotelId}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
