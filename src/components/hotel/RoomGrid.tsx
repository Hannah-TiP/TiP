'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import Modal from '@/components/Modal';
import { getImageUrl, getLocalizedText } from '@/types/common';
import type { HotelRoom } from '@/types/hotel';
import { useLanguage } from '@/contexts/LanguageContext';

interface RoomGridProps {
  rooms: HotelRoom[];
  fallbackImage: string;
}

export default function RoomGrid({ rooms, fallbackImage }: RoomGridProps) {
  const { t } = useLanguage();
  const [openRoomIndex, setOpenRoomIndex] = useState<number | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const openRoom = openRoomIndex !== null ? rooms[openRoomIndex] : null;
  const openRoomImages = openRoom?.images ?? [];
  const totalImages = openRoomImages.length;

  const closeModal = useCallback(() => {
    setOpenRoomIndex(null);
    setCurrentImageIndex(0);
  }, []);

  const goToPrev = useCallback(() => {
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : totalImages - 1));
  }, [totalImages]);

  const goToNext = useCallback(() => {
    setCurrentImageIndex((prev) => (prev < totalImages - 1 ? prev + 1 : 0));
  }, [totalImages]);

  useEffect(() => {
    if (openRoomIndex === null) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openRoomIndex, goToPrev, goToNext]);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {rooms.map((room, index) => {
          const roomImage = room.images?.[0] ? getImageUrl(room.images[0]) : fallbackImage;
          const sizeText = room.size_sqm ? `${room.size_sqm} m²` : null;
          const summary = getLocalizedText(room.summary);
          const name = getLocalizedText(room.name);
          const imageCount = room.images?.length ?? 0;
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
                {imageCount > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setOpenRoomIndex(index);
                      setCurrentImageIndex(0);
                    }}
                    className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-1 text-xs text-white transition-colors hover:bg-black/80"
                    data-testid={`room-photo-badge-${index}`}
                  >
                    {t('hotel.room_view_photos').replace('{count}', String(imageCount))}
                  </button>
                )}
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

      <Modal
        isOpen={openRoom !== null}
        onClose={closeModal}
        ariaLabel={openRoom ? `${getLocalizedText(openRoom.name)} photos` : undefined}
      >
        {openRoom && totalImages > 0 && (
          <div className="p-6 pt-12" data-testid="room-photo-modal">
            <h2 className="mb-6 font-primary text-2xl font-light text-green-dark">
              {getLocalizedText(openRoom.name)}
            </h2>
            <div className="relative">
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-gray-light">
                <Image
                  src={getImageUrl(openRoomImages[currentImageIndex])}
                  alt={`${getLocalizedText(openRoom.name)} ${currentImageIndex + 1}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 800px"
                  className="object-cover"
                />
              </div>
              {totalImages > 1 && (
                <>
                  <button
                    type="button"
                    onClick={goToPrev}
                    className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
                    aria-label={t('hotel.aria_previous_image')}
                    data-testid="room-photo-prev"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5"
                    >
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={goToNext}
                    className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
                    aria-label={t('hotel.aria_next_image')}
                    data-testid="room-photo-next"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </>
              )}
            </div>
            {totalImages > 1 && (
              <p
                className="mt-3 text-center text-sm text-gray-text"
                data-testid="room-photo-counter"
              >
                {currentImageIndex + 1} / {totalImages}
              </p>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
