'use client';

import { useMemo, type ReactNode } from 'react';
import HeroGallery from '@/components/hotel/HeroGallery';
import HotelBreadcrumb from '@/components/hotel/HotelBreadcrumb';
import SectionTitle from '@/components/hotel/SectionTitle';
import RoomGrid from '@/components/hotel/RoomGrid';
import AmenityGrid from '@/components/hotel/AmenityGrid';
import LocationSection from '@/components/hotel/LocationSection';
import ReviewsPlaceholder from '@/components/hotel/ReviewsPlaceholder';
import FaqAccordion from '@/components/hotel/FaqAccordion';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLocalizedText } from '@/types/common';
import { getHotelImages, type Hotel } from '@/types/hotel';

interface KeyFact {
  label: string;
  value: string;
}

interface HotelDetailContentProps {
  hotel: Hotel;
  /**
   * Optional overlay rendered absolutely on top of the hero gallery
   * (e.g. WishlistButton). Used by the full hotel page; omitted in modal.
   */
  heroOverlay?: ReactNode;
  /**
   * Optional sticky/promo bar rendered between hero and detail grid.
   * Used by the full hotel page (StickyBookingBar). Omitted in modal.
   */
  stickyBar?: ReactNode;
  /**
   * Optional right-rail sidebar (e.g. BookingCard). When present the
   * detail grid renders 2 columns at lg+; otherwise single column.
   */
  sidebar?: ReactNode;
}

export default function HotelDetailContent({
  hotel,
  heroOverlay,
  stickyBar,
  sidebar,
}: HotelDetailContentProps) {
  const { t } = useLanguage();

  const hotelImages = useMemo(() => getHotelImages(hotel), [hotel]);
  const hotelName = getLocalizedText(hotel.name) || hotel.slug;
  const address = getLocalizedText(hotel.address);
  const overview = getLocalizedText(hotel.overview);
  const rooms = hotel.rooms ?? [];
  const features = hotel.features ?? [];
  const faqs = hotel.faqs ?? [];

  const keyFacts: KeyFact[] = [
    hotel.star_rating ? { label: t('hotel.fact_star_rating'), value: hotel.star_rating } : null,
    hotel.check_in_time ? { label: t('hotel.fact_check_in'), value: hotel.check_in_time } : null,
    hotel.check_out_time ? { label: t('hotel.fact_check_out'), value: hotel.check_out_time } : null,
  ].filter((fact): fact is KeyFact => fact !== null);

  const showLocationSection = !!hotel.geo || !!address;
  const showOverviewSection = overview.length > 0 || keyFacts.length > 0;

  return (
    <>
      <HotelBreadcrumb hotelName={hotelName} cityLabel={address || undefined} />

      <div className="relative">
        <HeroGallery
          images={hotelImages}
          hotelName={hotelName}
          subtitle={address || undefined}
          starRating={hotel.star_rating}
          showTipCertified={hotel.status === 'published'}
          tipCertifiedLabel={t('hotel.tip_certified')}
        />
        {heroOverlay && <div className="absolute right-6 top-6 z-20">{heroOverlay}</div>}
      </div>

      {stickyBar}

      <div
        className={`mx-auto grid max-w-7xl grid-cols-1 gap-16 px-6 py-16 md:px-10 ${
          sidebar ? 'lg:grid-cols-[1fr_380px]' : ''
        }`}
      >
        <div className="min-w-0">
          {showOverviewSection && (
            <section aria-labelledby="overview-title" className="mb-14">
              <SectionTitle
                id="overview-title"
                overline={t('hotel.about_overline')}
                title={t('hotel.about_title')}
              />
              {overview && <p className="text-[15px] leading-[1.95] text-gray-text">{overview}</p>}

              {keyFacts.length > 0 && (
                <div className="mt-8 grid grid-cols-1 gap-px bg-gray-border md:grid-cols-3">
                  {keyFacts.map((fact) => (
                    <div key={fact.label} className="bg-gray-light px-4 py-6 text-center">
                      <span className="block font-primary text-[28px] font-light text-gold">
                        {fact.value}
                      </span>
                      <span className="mt-1 block text-[11px] uppercase tracking-[1.5px] text-gray-text">
                        {fact.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {rooms.length > 0 && (
            <section aria-labelledby="rooms-title" className="mb-14">
              <SectionTitle
                id="rooms-title"
                overline={t('hotel.rooms_overline')}
                title={t('hotel.rooms_title')}
              />
              <RoomGrid rooms={rooms} fallbackImage={hotelImages[0]} />
            </section>
          )}

          {features.length > 0 && (
            <section aria-labelledby="amenities-title" className="mb-14">
              <SectionTitle
                id="amenities-title"
                overline={t('hotel.amenities_overline')}
                title={t('hotel.amenities_title')}
              />
              <AmenityGrid features={features} />
            </section>
          )}

          {showLocationSection && (
            <section aria-labelledby="location-title" className="mb-14">
              <SectionTitle
                id="location-title"
                overline={t('hotel.location_overline')}
                title={t('hotel.location_title')}
              />
              <LocationSection hotelName={hotelName} description={address} geo={hotel.geo} />
            </section>
          )}

          <section aria-labelledby="reviews-title" className="mb-14">
            <SectionTitle
              id="reviews-title"
              overline={t('hotel.reviews_overline')}
              title={t('hotel.reviews_title')}
            />
            <ReviewsPlaceholder
              title={t('hotel.reviews_placeholder_title')}
              body={t('hotel.reviews_placeholder_body')}
            />
          </section>

          {faqs.length > 0 && (
            <section aria-labelledby="faq-title" className="mb-14">
              <SectionTitle
                id="faq-title"
                overline={t('hotel.faq_overline')}
                title={t('hotel.faq_title')}
              />
              <FaqAccordion faqs={faqs} />
            </section>
          )}
        </div>

        {sidebar}
      </div>
    </>
  );
}
