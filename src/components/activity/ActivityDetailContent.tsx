'use client';

import Image from 'next/image';
import { getImageUrl, getLocalizedText } from '@/types/common';
import type { Activity } from '@/types/activity';

interface ActivityDetailContentProps {
  activity: Activity;
}

export default function ActivityDetailContent({ activity }: ActivityDetailContentProps) {
  const badge = activity.category ? activity.category.toUpperCase() : 'ACTIVITY';
  const heroImage = getImageUrl(activity.images?.[0]);
  const name = getLocalizedText(activity.name);
  const description = activity.description ? getLocalizedText(activity.description) : null;
  const address = activity.address ? getLocalizedText(activity.address) : null;
  const openingHours = activity.opening_hours ? getLocalizedText(activity.opening_hours) : null;
  const visitDuration = activity.visit_duration ? getLocalizedText(activity.visit_duration) : null;

  return (
    <>
      {/* Hero */}
      <section className="relative h-[400px] w-full overflow-hidden">
        <Image
          src={heroImage}
          alt={name}
          fill
          sizes="100vw"
          className="absolute inset-0 h-full w-full object-cover"
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
            ABOUT THIS EXPERIENCE
          </span>
          <h2 className="mt-3 font-primary text-[32px] italic leading-snug text-green-dark">
            {name}
          </h2>
          {description && (
            <p className="mt-4 text-[15px] leading-[1.8] text-gray-text">{description}</p>
          )}
          {visitDuration && (
            <div className="mt-6">
              <p className="font-primary text-[28px] font-semibold text-green-dark">
                {visitDuration}
              </p>
              <p className="text-[12px] text-gray-text">Visit Duration</p>
            </div>
          )}
        </div>
      </section>

      {/* Practical Info */}
      {(address || openingHours || visitDuration) && (
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
              {visitDuration && (
                <div className="rounded-xl bg-white p-6 shadow-sm">
                  <span className="text-[11px] font-semibold tracking-[2px] text-gold">
                    VISIT DURATION
                  </span>
                  <p className="mt-3 text-[14px] leading-relaxed text-green-dark">
                    {visitDuration}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
