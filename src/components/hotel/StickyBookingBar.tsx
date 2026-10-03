'use client';

import { useLanguage } from '@/contexts/LanguageContext';

interface StickyBookingBarProps {
  perksLabel: string;
  perksSubtitle?: string;
}

/**
 * The green perks strip pinned to the top of the hotel page. Copy only: its
 * gold "Submit Request" button was removed in SMA-578 (TestFlight feedback;
 * the pinned button also surfaced its date-validation error off-screen in
 * the booking card). Booking actions live in `BookingCard` only.
 */
export default function StickyBookingBar({ perksLabel, perksSubtitle }: StickyBookingBarProps) {
  const { t } = useLanguage();
  return (
    <div
      className="sticky top-0 z-40 flex flex-col items-center gap-3 bg-green-dark px-4 py-4 sm:flex-row sm:justify-between sm:gap-4 md:px-10"
      role="complementary"
      aria-label={t('hotel.aria_booking_summary')}
    >
      <div className="text-center text-white sm:text-left">
        <p className="text-[12px] font-semibold uppercase tracking-[2px] text-gold">{perksLabel}</p>
        {perksSubtitle && <p className="mt-1 text-[13px] text-white/70">{perksSubtitle}</p>}
      </div>
    </div>
  );
}
