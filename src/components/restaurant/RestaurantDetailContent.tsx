'use client';

import Image from 'next/image';
import { getImageUrl, getLocalizedText } from '@/types/common';
import type { Restaurant } from '@/types/restaurant';

interface RestaurantDetailContentProps {
  restaurant: Restaurant;
}

export default function RestaurantDetailContent({ restaurant }: RestaurantDetailContentProps) {
  const primaryRecognition = restaurant.recognitions?.[0];
  const badge =
    primaryRecognition?.source_type === 'michelin' && primaryRecognition.tier
      ? primaryRecognition.tier.replaceAll('_', ' ').toUpperCase()
      : 'RESTAURANT';
  const name = getLocalizedText(restaurant.name);
  const description = getLocalizedText(restaurant.description);
  const address = restaurant.address ? getLocalizedText(restaurant.address) : null;
  const openingHours = restaurant.opening_hours ? getLocalizedText(restaurant.opening_hours) : null;

  return (
    <>
      {/* Hero */}
      <section className="relative h-[400px] w-full overflow-hidden">
        <Image
          src={getImageUrl(restaurant.images?.[0])}
          alt={name}
          className="absolute inset-0 object-cover"
          fill
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="relative z-10 flex h-full flex-col justify-end px-10 pb-10">
          <span className="mb-3 inline-block w-fit rounded-full bg-gold/90 px-4 py-1.5 text-[11px] font-semibold tracking-[2px] text-white">
            {badge}
          </span>
          <h1 className="font-primary text-[42px] font-normal italic leading-none text-white">
            {name}
          </h1>
          {description && (
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/70">
              {description}
            </p>
          )}
        </div>
      </section>

      {/* About */}
      <section className="bg-white px-10 py-12">
        <div className="mx-auto max-w-4xl">
          <span className="text-[11px] font-semibold tracking-[4px] text-gold">
            ABOUT THIS RESTAURANT
          </span>
          <h2 className="mt-3 font-primary text-[32px] italic leading-snug text-green-dark">
            {name}
          </h2>
          {description && (
            <p className="mt-4 text-[15px] leading-[1.8] text-gray-text">{description}</p>
          )}
          {primaryRecognition && (
            <div className="mt-6">
              <p className="font-primary text-[28px] font-semibold text-green-dark">
                {primaryRecognition.tier?.replaceAll('_', ' ') || primaryRecognition.source_type}
              </p>
              <p className="text-[12px] text-gray-text">Recognition</p>
            </div>
          )}
        </div>
      </section>

      {/* Practical Info */}
      {(address || openingHours) && (
        <section className="bg-gray-light px-10 py-12">
          <div className="mx-auto max-w-4xl">
            <div className="mb-8 text-center">
              <span className="text-[11px] font-semibold tracking-[4px] text-gold">
                PLAN YOUR VISIT
              </span>
              <h2 className="mt-3 font-primary text-[32px] italic text-green-dark">
                Practical Information
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {address && (
                <div className="rounded-xl bg-white p-6 shadow-sm">
                  <span className="text-[11px] font-semibold tracking-[2px] text-gold">
                    ADDRESS
                  </span>
                  <p className="mt-3 text-[14px] leading-relaxed text-green-dark">{address}</p>
                </div>
              )}
              {openingHours && (
                <div className="rounded-xl bg-white p-6 shadow-sm">
                  <span className="text-[11px] font-semibold tracking-[2px] text-gold">
                    OPENING HOURS
                  </span>
                  <p className="mt-3 text-[14px] leading-relaxed text-green-dark">{openingHours}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
