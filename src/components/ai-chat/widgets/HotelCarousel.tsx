'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { HotelCarouselConfig, UIBlock, WidgetResponse } from '@/types/ai-chat';
import type { MultiLanguageString } from '@/types/common';

interface Props {
  block: UIBlock;
  config: HotelCarouselConfig;
  onSubmit: (response: WidgetResponse) => void;
  disabled?: boolean;
}

function readMultiLang(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    const m = value as MultiLanguageString;
    return m.en ?? m.kr ?? '';
  }
  return '';
}

function readImageUrl(images: unknown): string | null {
  if (!Array.isArray(images) || images.length === 0) return null;
  const first = images[0];
  if (typeof first === 'string') return first;
  if (first && typeof first === 'object') {
    const candidate = first as Record<string, unknown>;
    const url = candidate.original ?? candidate.url ?? candidate.public_url ?? candidate.src;
    if (typeof url === 'string') return url;
  }
  return null;
}

export default function HotelCarousel({ block, config, onSubmit, disabled }: Props) {
  const hotels = config.hotels ?? [];
  const [selectedId, setSelectedId] = useState<number | null>(null);

  function handleSelect(hotelId: number, hotelName: string) {
    if (disabled || selectedId !== null) return;
    setSelectedId(hotelId);
    onSubmit({
      widget_id: block.id,
      widget_type: 'hotel_carousel',
      value: { hotel_id: hotelId, hotel_name: hotelName },
    });
  }

  if (hotels.length === 0) return null;

  return (
    <div className="mt-3 border border-gray-200 rounded-lg p-3 bg-white">
      <p className="font-inter text-xs text-gray-500 mb-3">{block.label}</p>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {hotels.map((hotel) => {
          const name = readMultiLang(hotel.name) || `Hotel ${hotel.id}`;
          const imgUrl = readImageUrl(hotel.images);
          const isSelected = selectedId === hotel.id;
          return (
            <button
              type="button"
              key={hotel.id}
              onClick={() => handleSelect(hotel.id, name)}
              disabled={disabled || selectedId !== null}
              className={`shrink-0 w-44 text-left rounded-lg overflow-hidden border transition-all disabled:opacity-60 ${
                isSelected ? 'border-[#1E3D2F] ring-2 ring-[#1E3D2F]' : 'border-gray-200'
              }`}
              data-testid={`hotel-card-${hotel.id}`}
            >
              <div className="relative w-full h-24 bg-gray-100">
                {imgUrl ? (
                  <Image
                    src={imgUrl}
                    alt={name}
                    fill
                    sizes="176px"
                    className="object-cover"
                    unoptimized
                  />
                ) : null}
              </div>
              <div className="p-2">
                <p className="font-inter text-xs font-medium text-[#1E3D2F] line-clamp-2">{name}</p>
                {hotel.star_rating != null && (
                  <p className="font-inter text-[10px] text-gray-500 mt-1">{hotel.star_rating}★</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
