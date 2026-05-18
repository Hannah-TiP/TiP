'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Modal from '@/components/Modal';
import HotelDetailContent from '@/components/hotel/HotelDetailContent';
import { apiClient } from '@/lib/api-client';
import type { AIChatHotelCarouselWidget, AIChatWidgetResponse } from '@/types/ai-chat';
import { getImageUrl } from '@/types/common';
import type { Hotel } from '@/types/hotel';

interface Props {
  widget: AIChatHotelCarouselWidget;
  onSubmit: (response: AIChatWidgetResponse) => void;
  disabled?: boolean;
}

export default function HotelCarousel({ widget, onSubmit, disabled }: Props) {
  const hotels = widget.hotels ?? [];
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeHotelId, setActiveHotelId] = useState<number | null>(null);
  const [activeHotelName, setActiveHotelName] = useState<string | null>(null);
  const [previewHotel, setPreviewHotel] = useState<Hotel | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const isModalOpen = activeHotelId !== null;

  useEffect(() => {
    if (activeHotelId === null) return;
    let cancelled = false;

    apiClient
      .getHotelById(activeHotelId)
      .then((hotel) => {
        if (cancelled) return;
        setPreviewHotel(hotel);
        setPreviewLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Failed to load hotel preview:', err);
        setPreviewError('Could not load hotel details. Please try again.');
        setPreviewLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeHotelId]);

  function handleCardClick(hotel: { id: number; name: string | null }) {
    if (disabled || selectedId !== null) return;
    // Initialize loading state synchronously with opening the modal so the
    // effect only owns the async fetch result.
    setPreviewHotel(null);
    setPreviewError(null);
    setPreviewLoading(true);
    setActiveHotelId(hotel.id);
    setActiveHotelName(hotel.name);
  }

  function closeModal() {
    setActiveHotelId(null);
    setActiveHotelName(null);
    setPreviewHotel(null);
    setPreviewError(null);
    setPreviewLoading(false);
  }

  function handleConfirm() {
    if (activeHotelId === null) return;
    const hotelId = activeHotelId;
    const name = activeHotelName;
    setSelectedId(hotelId);
    closeModal();
    onSubmit({
      widget_id: widget.widget_id,
      widget_type: 'hotel_carousel',
      value: { hotel_id: hotelId, name },
    });
  }

  if (hotels.length === 0) return null;

  return (
    <>
      <div className="mt-3 border border-gray-200 rounded-lg p-3 bg-white">
        <p className="font-inter text-xs text-gray-500 mb-3">Select a hotel</p>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {hotels.map((hotel) => {
            const isSelected = selectedId === hotel.id;
            return (
              <button
                type="button"
                key={hotel.id}
                onClick={() => handleCardClick({ id: hotel.id, name: hotel.name })}
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

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        ariaLabel={activeHotelName ?? 'Hotel preview'}
      >
        {previewLoading && (
          <div
            className="flex items-center justify-center py-32"
            data-testid="hotel-preview-loading"
          >
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#1E3D2F] border-t-transparent"></div>
          </div>
        )}

        {!previewLoading && previewError && (
          <div
            className="flex flex-col items-center justify-center gap-4 py-24 px-6 text-center"
            data-testid="hotel-preview-error"
          >
            <p className="font-inter text-sm text-gray-600">{previewError}</p>
            <button
              type="button"
              onClick={closeModal}
              className="rounded-full bg-[#1E3D2F] px-6 py-2 text-[13px] font-semibold text-white hover:opacity-90"
            >
              Close
            </button>
          </div>
        )}

        {!previewLoading && !previewError && previewHotel && (
          <>
            <HotelDetailContent hotel={previewHotel} />
            <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 border-t border-gray-200 bg-white px-6 py-4">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full border border-gray-300 px-6 py-2 text-[13px] font-semibold text-gray-700 hover:bg-gray-50"
                data-testid="hotel-preview-cancel"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="rounded-full bg-[#1E3D2F] px-6 py-2 text-[13px] font-semibold text-white hover:opacity-90"
                data-testid="hotel-preview-confirm"
              >
                Select this hotel
              </button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
