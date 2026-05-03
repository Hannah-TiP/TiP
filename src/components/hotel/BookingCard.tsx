'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface BookingCardProps {
  hotelName: string;
  benefits: string[];
  onReserve: () => void;
  onAskConcierge: () => void;
  benefitsTitle?: string;
}

export default function BookingCard({
  hotelName,
  benefits,
  onReserve,
  onAskConcierge,
  benefitsTitle,
}: BookingCardProps) {
  const { t } = useLanguage();
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');

  const resolvedBenefitsTitle = benefitsTitle ?? t('hotel.booking_benefits_title');

  return (
    <aside aria-label="Booking card" className="lg:sticky lg:top-24">
      <div className="border border-gray-border bg-white p-7">
        <p className="font-primary text-[22px] italic text-green-dark">
          {t('hotel.booking_card_reserve_title')} {hotelName}
        </p>
        <p className="mt-1 text-[12px] uppercase tracking-[2px] text-gray-text">
          {t('hotel.booking_card_subtitle')}
        </p>

        {benefits.length > 0 && (
          <div
            className="mt-5 bg-gradient-to-br from-green-dark to-[#152b22] p-5 text-[13px] leading-[1.7] text-white"
            role="complementary"
          >
            <p className="font-semibold uppercase tracking-[1.5px] text-gold">
              ✦ {resolvedBenefitsTitle}
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5">
              {benefits.map((benefit, index) => (
                <li key={index} className="text-white/85">
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-2">
          <div>
            <label
              htmlFor="hotel-booking-checkin"
              className="block text-[10px] font-semibold uppercase tracking-[1.5px] text-gray-text"
            >
              {t('hotel.booking_check_in')}
            </label>
            <input
              id="hotel-booking-checkin"
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="mt-1 w-full border border-gray-border bg-gray-light px-3 py-2 text-[13px] text-green-dark focus:border-gold focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="hotel-booking-checkout"
              className="block text-[10px] font-semibold uppercase tracking-[1.5px] text-gray-text"
            >
              {t('hotel.booking_check_out')}
            </label>
            <input
              id="hotel-booking-checkout"
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="mt-1 w-full border border-gray-border bg-gray-light px-3 py-2 text-[13px] text-green-dark focus:border-gold focus:outline-none"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onReserve}
          className="mt-5 w-full bg-gold py-4 text-[12px] font-semibold uppercase tracking-[2px] text-white transition-opacity hover:opacity-90"
        >
          {t('hotel.booking_reserve_cta')}
        </button>
        <button
          type="button"
          onClick={onAskConcierge}
          className="mt-3 w-full border border-gray-border py-3 text-[12px] font-semibold uppercase tracking-[1.5px] text-green-dark transition-colors hover:border-gold hover:text-gold"
        >
          {t('hotel.booking_concierge_cta')}
        </button>

        <ul className="mt-6 flex justify-center gap-6 text-[11px] text-gray-text">
          <li className="flex flex-col items-center gap-1">
            <span aria-hidden="true" className="text-[18px]">
              🔒
            </span>
            <span>{t('hotel.trust_secure')}</span>
          </li>
          <li className="flex flex-col items-center gap-1">
            <span aria-hidden="true" className="text-[18px]">
              ↩
            </span>
            <span>{t('hotel.trust_cancel')}</span>
          </li>
          <li className="flex flex-col items-center gap-1">
            <span aria-hidden="true" className="text-[18px]">
              💬
            </span>
            <span>{t('hotel.trust_support')}</span>
          </li>
        </ul>
      </div>
    </aside>
  );
}
