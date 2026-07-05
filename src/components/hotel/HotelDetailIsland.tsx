'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Footer from '@/components/Footer';
import WishlistButton from '@/components/WishlistButton';
import StickyBookingBar from '@/components/hotel/StickyBookingBar';
import BookingCard from '@/components/hotel/BookingCard';
import HotelDetailContent from '@/components/hotel/HotelDetailContent';
import FromTheMagazine from '@/components/hotel/FromTheMagazine';
import { apiClient } from '@/lib/api-client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useHotelBooking } from '@/hooks/useHotelBooking';
import { getLocalizedText } from '@/types/common';
import { type Hotel } from '@/types/hotel';
import type { MagazineHotelArticleRef } from '@/types/magazine-hotel';
import { filterBenefitsByDates, formatBenefitEligibility } from '@/lib/hotel-benefits';

const DEFAULT_ADULTS = 2;
const DEFAULT_KIDS = 0;

function parseCount(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const n = parseInt(value, 10);
  if (Number.isNaN(n) || n < 0) return fallback;
  return n;
}

interface HotelDetailIslandProps {
  slug: string;
  /**
   * Hotel fetched server-side (initial paint). The island still owns a
   * client re-fetch on language switch so KR/EN content updates without a
   * full navigation — matching the SJ-5 island pattern.
   */
  initialHotel: Hotel;
  /**
   * Featured magazine articles for this hotel (server-fetched via the bridge).
   * Rendered in the "From the Magazine" section; hidden when empty.
   */
  featured: MagazineHotelArticleRef[];
}

/**
 * Client island for the hotel detail page. Holds ALL of the interactive logic —
 * booking-input prefill, auto-resume after sign-in, session gate, and the
 * language-keyed client re-fetch — that used to live in the page component.
 * The server shell wraps this island with `generateMetadata` + the JSON-LD
 * stack; this island renders the visible page unchanged.
 */
export default function HotelDetailIsland({
  slug,
  initialHotel,
  featured,
}: HotelDetailIslandProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, lang } = useLanguage();
  const { status: sessionStatus } = useSession();

  const [hotel, setHotel] = useState<Hotel>(initialHotel);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState(DEFAULT_ADULTS);
  const [kids, setKids] = useState(DEFAULT_KIDS);

  // Prefill the booking inputs from the URL when the user is bounced back
  // from the sign-in page. Reading on first render avoids a flash of empty
  // inputs before auto-resume fires.
  const initialCheckIn = searchParams.get('checkin') ?? '';
  const initialCheckOut = searchParams.get('checkout') ?? '';
  const initialAdults = parseCount(searchParams.get('adults'), DEFAULT_ADULTS);
  const initialKids = parseCount(searchParams.get('kids'), DEFAULT_KIDS);
  useEffect(() => {
    if (initialCheckIn) setCheckIn(initialCheckIn);
    if (initialCheckOut) setCheckOut(initialCheckOut);
    if (searchParams.get('adults')) setAdults(initialAdults);
    if (searchParams.get('kids')) setKids(initialKids);
    // We deliberately depend only on the initial values; subsequent URL
    // changes are made via router.replace below and must not overwrite the
    // user's edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch the hotel on language switch so KR/EN content updates without a
  // full navigation. The server-fetched hotel seeds the first paint, so this
  // only fires on a subsequent `lang` change (the ref skips the initial run).
  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    let cancelled = false;
    async function reloadHotel() {
      try {
        const hotelData = await apiClient.getHotelBySlug(slug, lang);
        if (!cancelled) setHotel(hotelData);
      } catch (err) {
        console.error('Failed to reload hotel:', err);
      }
    }
    reloadHotel();
    return () => {
      cancelled = true;
    };
  }, [slug, lang]);

  const { reserve, askConcierge, submitRequest, dateError, apiError, clearErrors, isSubmitting } =
    useHotelBooking({ hotelId: hotel.id, hotelSlug: slug });

  // Auto-resume after sign-in: when the URL carries an action flag and the
  // user is now authed, fire the corresponding handler once and strip the
  // query params so a refresh doesn't re-fire.
  const autoResumedRef = useRef(false);
  useEffect(() => {
    if (autoResumedRef.current) return;
    if (sessionStatus !== 'authenticated') return;

    const shouldReserve = searchParams.get('reserve') === '1';
    const shouldAsk = searchParams.get('ask') === '1';
    const shouldSubmitRequest = searchParams.get('submit_request') === '1';
    if (!shouldReserve && !shouldAsk && !shouldSubmitRequest) return;

    const checkInParam = searchParams.get('checkin') ?? '';
    const checkOutParam = searchParams.get('checkout') ?? '';

    autoResumedRef.current = true;

    if (shouldSubmitRequest) {
      const adultsParam = parseCount(searchParams.get('adults'), DEFAULT_ADULTS);
      const kidsParam = parseCount(searchParams.get('kids'), DEFAULT_KIDS);
      submitRequest(checkInParam, checkOutParam, adultsParam, kidsParam);
    } else if (shouldReserve) {
      reserve(checkInParam, checkOutParam);
    } else {
      askConcierge(checkInParam || undefined, checkOutParam || undefined);
    }

    // Clean the action+date+traveler params from the URL so a manual refresh
    // after dismiss doesn't trigger another submission.
    router.replace(`/hotel/${slug}`);
  }, [sessionStatus, searchParams, reserve, askConcierge, submitRequest, router, slug]);

  const hotelName = getLocalizedText(hotel.name, lang) || hotel.slug;

  const tipBenefits = (() => {
    const allPrograms = hotel.benefits ?? [];
    const hasDates = Boolean(checkIn) && Boolean(checkOut);
    const programs = hasDates ? filterBenefitsByDates(allPrograms, checkIn, checkOut) : allPrograms;
    const eligibilityTemplates = {
      range: t('hotel.benefit_eligibility_range'),
      from: t('hotel.benefit_eligibility_from'),
      until: t('hotel.benefit_eligibility_until'),
      month: (m: number) => t(`hotel.benefit_month_abbr_${m}` as Parameters<typeof t>[0]),
    };
    return programs.flatMap((program) => {
      const label = hasDates
        ? null
        : formatBenefitEligibility(program.valid_from, program.valid_until, eligibilityTemplates);
      return program.benefits
        .map((benefit) => getLocalizedText(benefit, lang))
        .filter(Boolean)
        .map((text) => (label ? `${text} (${label})` : text));
    });
  })();

  const handleSubmitRequest = () => submitRequest(checkIn, checkOut, adults, kids);
  const handleAskConcierge = () => askConcierge(checkIn || undefined, checkOut || undefined);
  const handleCheckInChange = (value: string) => {
    setCheckIn(value);
    if (dateError || apiError) clearErrors();
  };
  const handleCheckOutChange = (value: string) => {
    setCheckOut(value);
    if (dateError || apiError) clearErrors();
  };
  const handleAdultsChange = (value: number) => {
    setAdults(value);
    if (dateError || apiError) clearErrors();
  };
  const handleKidsChange = (value: number) => {
    setKids(value);
    if (dateError || apiError) clearErrors();
  };

  return (
    <main className="min-h-screen bg-background">
      <HotelDetailContent
        hotel={hotel}
        heroOverlay={<WishlistButton hotelId={hotel.id} size="lg" />}
        stickyBar={
          <StickyBookingBar
            perksLabel={t('hotel.tip_exclusive_perks')}
            perksSubtitle={t('hotel.exclusive_perks_subtitle')}
            ctaLabel={t('hotel.submit_request_cta')}
            onReserveClick={handleSubmitRequest}
          />
        }
        sidebar={
          <BookingCard
            hotelName={hotelName}
            benefits={tipBenefits}
            checkIn={checkIn}
            checkOut={checkOut}
            adults={adults}
            kids={kids}
            onCheckInChange={handleCheckInChange}
            onCheckOutChange={handleCheckOutChange}
            onAdultsChange={handleAdultsChange}
            onKidsChange={handleKidsChange}
            onSubmitRequest={handleSubmitRequest}
            onAskConcierge={handleAskConcierge}
            errorMessage={dateError ?? apiError ?? null}
            isSubmitting={isSubmitting}
          />
        }
        belowContent={<FromTheMagazine featured={featured} />}
      />

      <Footer />
    </main>
  );
}
