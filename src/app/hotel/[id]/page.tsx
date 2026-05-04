'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import TopBar from '@/components/TopBar';
import Footer from '@/components/Footer';
import WishlistButton from '@/components/WishlistButton';
import HeroGallery from '@/components/hotel/HeroGallery';
import HotelBreadcrumb from '@/components/hotel/HotelBreadcrumb';
import StickyBookingBar from '@/components/hotel/StickyBookingBar';
import BookingCard from '@/components/hotel/BookingCard';
import SectionTitle from '@/components/hotel/SectionTitle';
import RoomGrid from '@/components/hotel/RoomGrid';
import AmenityGrid from '@/components/hotel/AmenityGrid';
import LocationSection from '@/components/hotel/LocationSection';
import ReviewsPlaceholder from '@/components/hotel/ReviewsPlaceholder';
import FaqAccordion from '@/components/hotel/FaqAccordion';
import { apiClient } from '@/lib/api-client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useHotelBooking } from '@/hooks/useHotelBooking';
import { getLocalizedText } from '@/types/common';
import { getHotelImages, type Hotel } from '@/types/hotel';

interface KeyFact {
  label: string;
  value: string;
}

export default function HotelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params.id as string;
  const { t } = useLanguage();
  const { status: sessionStatus } = useSession();

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');

  // Prefill the date inputs from the URL when the user is bounced back
  // from the sign-in page. Reading on first render avoids a flash of empty
  // inputs before auto-resume fires.
  const initialCheckIn = searchParams.get('checkin') ?? '';
  const initialCheckOut = searchParams.get('checkout') ?? '';
  useEffect(() => {
    if (initialCheckIn) setCheckIn(initialCheckIn);
    if (initialCheckOut) setCheckOut(initialCheckOut);
    // We deliberately depend only on the initial values; subsequent URL
    // changes are made via router.replace below and must not overwrite the
    // user's edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    async function loadHotel() {
      try {
        setIsLoading(true);
        setError(null);
        const hotelData = await apiClient.getHotelBySlug(slug);
        setHotel(hotelData);
      } catch (err) {
        console.error('Failed to load hotel:', err);
        setError('Hotel not found');
      } finally {
        setIsLoading(false);
      }
    }

    if (slug) {
      loadHotel();
    }
  }, [slug]);

  const { reserve, askConcierge, dateError, apiError, clearErrors, isSubmitting } = useHotelBooking(
    { hotelId: hotel?.id ?? null, hotelSlug: slug },
  );

  // Auto-resume after sign-in: when the URL carries ?reserve=1 or ?ask=1
  // and the user is now authed, fire the corresponding handler once and
  // strip the query params so a refresh doesn't re-fire.
  const autoResumedRef = useRef(false);
  useEffect(() => {
    if (autoResumedRef.current) return;
    if (sessionStatus !== 'authenticated') return;
    if (!hotel) return;

    const shouldReserve = searchParams.get('reserve') === '1';
    const shouldAsk = searchParams.get('ask') === '1';
    if (!shouldReserve && !shouldAsk) return;

    const checkInParam = searchParams.get('checkin') ?? '';
    const checkOutParam = searchParams.get('checkout') ?? '';

    autoResumedRef.current = true;

    if (shouldReserve) {
      reserve(checkInParam, checkOutParam);
    } else {
      askConcierge(checkInParam || undefined, checkOutParam || undefined);
    }

    // Clean the action+date params from the URL so a manual refresh after
    // dismiss doesn't trigger another submission.
    router.replace(`/hotel/${slug}`);
  }, [sessionStatus, hotel, searchParams, reserve, askConcierge, router, slug]);

  const hotelImages = useMemo(
    () => (hotel ? getHotelImages(hotel) : ['/placeholder.jpg']),
    [hotel],
  );

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background">
        <TopBar activeLink="Dream Hotels" />
        <div className="flex items-center justify-center py-40">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-green-dark border-t-transparent"></div>
        </div>
        <Footer />
      </main>
    );
  }

  if (error || !hotel) {
    return (
      <main className="min-h-screen bg-background">
        <TopBar activeLink="Dream Hotels" />
        <div className="flex flex-col items-center justify-center py-40">
          <h1 className="font-primary text-[42px] italic text-green-dark">
            {t('hotel.not_found_title')}
          </h1>
          <p className="mt-4 text-gray-text">{t('hotel.not_found_message')}</p>
          <Link
            href="/dream-hotels"
            className="mt-8 rounded-full bg-green-dark px-8 py-3 text-[13px] font-semibold text-white hover:bg-green-dark/90"
          >
            {t('hotel.back_to_hotels')}
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  const hotelName = getLocalizedText(hotel.name) || hotel.slug;
  const address = getLocalizedText(hotel.address);
  const overview = getLocalizedText(hotel.overview);
  const rooms = hotel.rooms ?? [];
  const features = hotel.features ?? [];
  const faqs = hotel.faqs ?? [];

  const tipBenefits = (() => {
    const programBenefits = (hotel.benefits ?? []).flatMap((program) =>
      program.benefits.map((benefit) => getLocalizedText(benefit)).filter(Boolean),
    );
    if (programBenefits.length > 0) return programBenefits;
    return [
      t('hotel.booking_benefit_1'),
      t('hotel.booking_benefit_2'),
      t('hotel.booking_benefit_3'),
      t('hotel.booking_benefit_4'),
    ];
  })();

  const keyFacts: KeyFact[] = [
    hotel.star_rating ? { label: t('hotel.fact_star_rating'), value: hotel.star_rating } : null,
    hotel.check_in_time ? { label: t('hotel.fact_check_in'), value: hotel.check_in_time } : null,
    hotel.check_out_time ? { label: t('hotel.fact_check_out'), value: hotel.check_out_time } : null,
  ].filter((fact): fact is KeyFact => fact !== null);

  const handleReserve = () => reserve(checkIn, checkOut);
  const handleAskConcierge = () => askConcierge(checkIn || undefined, checkOut || undefined);
  const handleCheckInChange = (value: string) => {
    setCheckIn(value);
    if (dateError || apiError) clearErrors();
  };
  const handleCheckOutChange = (value: string) => {
    setCheckOut(value);
    if (dateError || apiError) clearErrors();
  };

  const showLocationSection = !!hotel.geo || !!address;
  const showOverviewSection = overview.length > 0 || keyFacts.length > 0;

  return (
    <main className="min-h-screen bg-background">
      <TopBar activeLink="Dream Hotels" />

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
        <div className="absolute right-6 top-6 z-20">
          <WishlistButton hotelId={hotel.id} size="lg" />
        </div>
      </div>

      <StickyBookingBar
        perksLabel={t('hotel.tip_exclusive_perks')}
        perksSubtitle={t('hotel.exclusive_perks_subtitle')}
        ctaLabel={t('hotel.reserve_cta')}
        onReserveClick={handleReserve}
      />

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-16 px-6 py-16 md:px-10 lg:grid-cols-[1fr_380px]">
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

        <BookingCard
          hotelName={hotelName}
          benefits={tipBenefits}
          checkIn={checkIn}
          checkOut={checkOut}
          onCheckInChange={handleCheckInChange}
          onCheckOutChange={handleCheckOutChange}
          onReserve={handleReserve}
          onAskConcierge={handleAskConcierge}
          errorMessage={dateError ?? apiError ?? null}
          isSubmitting={isSubmitting}
        />
      </div>

      <Footer />
    </main>
  );
}
