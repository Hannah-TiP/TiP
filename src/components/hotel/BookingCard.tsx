'use client';

import { useLanguage } from '@/contexts/LanguageContext';

interface BookingCardProps {
  hotelName: string;
  benefits: string[];
  checkIn: string;
  checkOut: string;
  adults: number;
  kids: number;
  onCheckInChange: (value: string) => void;
  onCheckOutChange: (value: string) => void;
  onAdultsChange: (value: number) => void;
  onKidsChange: (value: number) => void;
  onSubmitRequest: () => void;
  onAskConcierge: () => void;
  errorMessage?: string | null;
  isSubmitting?: boolean;
  benefitsTitle?: string;
}

const ADULTS_MIN = 1;
const ADULTS_MAX = 20;
const KIDS_MIN = 0;
const KIDS_MAX = 10;

interface StepperProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  decrementLabel: string;
  incrementLabel: string;
}

function Stepper({
  id,
  label,
  value,
  min,
  max,
  onChange,
  decrementLabel,
  incrementLabel,
}: StepperProps) {
  const dec = () => {
    if (value > min) onChange(value - 1);
  };
  const inc = () => {
    if (value < max) onChange(value + 1);
  };
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-[10px] font-semibold uppercase tracking-[1.5px] text-gray-text"
      >
        {label}
      </label>
      <div className="mt-1 flex items-center justify-between border border-gray-border bg-gray-light px-3 py-2">
        <button
          type="button"
          onClick={dec}
          disabled={value <= min}
          aria-label={decrementLabel}
          className="text-[16px] leading-none text-green-dark transition-opacity hover:text-gold disabled:cursor-not-allowed disabled:opacity-40"
        >
          −
        </button>
        <span
          id={id}
          aria-live="polite"
          data-testid={`booking-card-${id}-value`}
          className="text-[13px] font-semibold text-green-dark"
        >
          {value}
        </span>
        <button
          type="button"
          onClick={inc}
          disabled={value >= max}
          aria-label={incrementLabel}
          className="text-[16px] leading-none text-green-dark transition-opacity hover:text-gold disabled:cursor-not-allowed disabled:opacity-40"
        >
          +
        </button>
      </div>
    </div>
  );
}

export default function BookingCard({
  hotelName,
  benefits,
  checkIn,
  checkOut,
  adults,
  kids,
  onCheckInChange,
  onCheckOutChange,
  onAdultsChange,
  onKidsChange,
  onSubmitRequest,
  onAskConcierge,
  errorMessage,
  isSubmitting = false,
  benefitsTitle,
}: BookingCardProps) {
  const { t } = useLanguage();

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
              onChange={(e) => onCheckInChange(e.target.value)}
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
              onChange={(e) => onCheckOutChange(e.target.value)}
              className="mt-1 w-full border border-gray-border bg-gray-light px-3 py-2 text-[13px] text-green-dark focus:border-gold focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Stepper
            id="hotel-booking-adults"
            label={t('hotel.booking_adults')}
            value={adults}
            min={ADULTS_MIN}
            max={ADULTS_MAX}
            onChange={onAdultsChange}
            decrementLabel={t('hotel.booking_adults_decrement')}
            incrementLabel={t('hotel.booking_adults_increment')}
          />
          <Stepper
            id="hotel-booking-kids"
            label={t('hotel.booking_kids')}
            value={kids}
            min={KIDS_MIN}
            max={KIDS_MAX}
            onChange={onKidsChange}
            decrementLabel={t('hotel.booking_kids_decrement')}
            incrementLabel={t('hotel.booking_kids_increment')}
          />
        </div>

        {errorMessage && (
          <p
            role="alert"
            className="mt-3 text-[12px] leading-[1.5] text-red-600"
            data-testid="booking-card-error"
          >
            {errorMessage}
          </p>
        )}

        <button
          type="button"
          onClick={onSubmitRequest}
          disabled={isSubmitting}
          className="mt-5 w-full bg-gold py-4 text-[12px] font-semibold uppercase tracking-[2px] text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t('hotel.booking_submit_request_cta')}
        </button>
        <button
          type="button"
          onClick={onAskConcierge}
          disabled={isSubmitting}
          className="mt-3 w-full border border-gray-border py-3 text-[12px] font-semibold uppercase tracking-[1.5px] text-green-dark transition-colors hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-60"
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
