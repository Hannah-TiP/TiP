'use client';

import { useState } from 'react';
import DatePickerDropdown from './DatePickerDropdown';
import GuestsDropdown from './GuestsDropdown';
import DestinationDropdown from './DestinationDropdown';
import TripTypeDropdown from './TripTypeDropdown';
import TravelStyleDropdown from './TravelStyleDropdown';
import { useLanguage } from '@/contexts/LanguageContext';

export default function SearchBar() {
  const { t } = useLanguage();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [destination, setDestination] = useState<{ id: number; name: string } | null>(null);
  const [dates, setDates] = useState({ checkIn: '', checkOut: '' });
  const [guests, setGuests] = useState({ adults: 2, children: 0 });
  const [tripType, setTripType] = useState('Leisure');
  const [travelStyle, setTravelStyle] = useState('');
  // Mobile-only: the full-screen planner overlay. Below `md` the inline bar is
  // hidden and replaced by a single CTA that opens this overlay.
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  const toggleDropdown = (name: string) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  const totalGuests = guests.adults + guests.children;
  const guestsLabel = `${totalGuests} ${
    totalGuests === 1 ? t('search.guest_one') : t('search.guest_other')
  }`;

  const handleSearch = () => {
    // Destination is optional — if missing, the concierge AI will ask for it.
    // Build the prefill query params for /concierge.
    const params = new URLSearchParams();
    params.set('prefill', '1');

    if (destination) {
      params.set('cityId', destination.id.toString());
      params.set('city', destination.name);
    }

    if (dates.checkIn) params.set('checkIn', dates.checkIn);
    if (dates.checkOut) params.set('checkOut', dates.checkOut);

    params.set('adults', guests.adults.toString());
    params.set('children', guests.children.toString());

    if (tripType) params.set('tripType', tripType);
    if (travelStyle) params.set('travelStyle', travelStyle);

    // Route to the AI concierge, which picks up the prefill and creates a
    // new chat session seeded with these search values.
    //
    // Use a full navigation, not router.push(): an unauthenticated visitor
    // is bounced through middleware to /sign-in, and Next.js's client
    // router cache may hold a prefetched bare `/concierge` redirect (no
    // query) from an in-viewport <Link href="/concierge">. router.push()
    // matches that cache entry by pathname and reuses the unparameterized
    // redirect, dropping the prefill on the way to sign-in. A full
    // navigation always re-runs middleware against this exact URL, so the
    // prefill survives the round-trip.
    window.location.assign(`/concierge?${params.toString()}`);
  };

  // Field summary cells reused by both layouts. `align` controls label/value
  // alignment so the desktop bar keeps its compact left-aligned look.
  const fieldLabelClass = 'text-[10px] font-medium uppercase tracking-wider text-gray-400';
  const fieldValueClass = 'text-[14px] font-medium text-green-dark';

  return (
    <>
      {/* ── Desktop / tablet inline bar (≥ md) ─────────────────────────────── */}
      <div className="relative z-[100] hidden md:block">
        <div
          className="flex items-center rounded-lg bg-white/95"
          style={{
            height: 70,
            border: '1px solid rgba(0,0,0,0.06)',
          }}
        >
          {/* Destination */}
          <div
            className="relative flex h-full cursor-pointer flex-col justify-center px-6"
            style={{ minWidth: 180 }}
            onClick={() => toggleDropdown('destination')}
          >
            <span className={fieldLabelClass}>{t('search.destination')}</span>
            <span className={fieldValueClass}>
              {destination?.name || t('search.destination_placeholder')}
            </span>
          </div>

          <div className="h-8 w-px bg-gray-200" />

          {/* Check-in */}
          <div
            className="relative flex h-full cursor-pointer flex-col justify-center px-6"
            style={{ minWidth: 140 }}
            onClick={() => toggleDropdown('dates')}
          >
            <span className={fieldLabelClass}>{t('search.check_in')}</span>
            <span className={fieldValueClass}>{dates.checkIn || t('search.add_date')}</span>
          </div>

          <div className="h-8 w-px bg-gray-200" />

          {/* Check-out */}
          <div
            className="relative flex h-full cursor-pointer flex-col justify-center px-6"
            style={{ minWidth: 140 }}
            onClick={() => toggleDropdown('dates')}
          >
            <span className={fieldLabelClass}>{t('search.check_out')}</span>
            <span className={fieldValueClass}>{dates.checkOut || t('search.add_date')}</span>
          </div>

          <div className="h-8 w-px bg-gray-200" />

          {/* Guests */}
          <div
            className="relative flex h-full cursor-pointer flex-col justify-center px-6"
            style={{ minWidth: 120 }}
            onClick={() => toggleDropdown('guests')}
          >
            <span className={fieldLabelClass}>{t('search.guests')}</span>
            <span className={fieldValueClass}>{guestsLabel}</span>
          </div>

          <div className="h-8 w-px bg-gray-200" />

          {/* Trip Type */}
          <div
            className="relative flex h-full cursor-pointer flex-col justify-center px-6"
            style={{ minWidth: 120 }}
            onClick={() => toggleDropdown('tripType')}
          >
            <span className={fieldLabelClass}>{t('search.trip_type')}</span>
            <span className={fieldValueClass}>{tripType}</span>
          </div>

          <div className="h-8 w-px bg-gray-200" />

          {/* Travel Style */}
          <div
            className="relative flex h-full cursor-pointer flex-col justify-center px-6"
            style={{ minWidth: 140 }}
            onClick={() => toggleDropdown('travelStyle')}
          >
            <span className={fieldLabelClass}>{t('search.travel_style')}</span>
            <span className={fieldValueClass}>{travelStyle || t('search.any_style')}</span>
          </div>

          {/* Plan My Trip Button — routes to the AI concierge with prefill */}
          <button
            className="ml-auto mr-3 flex h-12 items-center gap-2 rounded-lg bg-green-dark px-6 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
            onClick={handleSearch}
          >
            <span className="icon-lucide">&#xe8b6;</span>
            {t('search.plan_my_trip')}
          </button>
        </div>

        {/* Desktop dropdowns */}
        {activeDropdown === 'destination' && (
          <DestinationDropdown
            value={destination?.name || ''}
            onChange={(cityData) => {
              setDestination(cityData);
              setActiveDropdown(null);
            }}
            onClose={() => setActiveDropdown(null)}
          />
        )}

        {activeDropdown === 'dates' && (
          <DatePickerDropdown
            checkIn={dates.checkIn}
            checkOut={dates.checkOut}
            onChange={(checkIn, checkOut) => setDates({ checkIn, checkOut })}
            onClose={() => setActiveDropdown(null)}
          />
        )}

        {activeDropdown === 'guests' && (
          <GuestsDropdown
            adults={guests.adults}
            kids={guests.children}
            onChange={(adults, children) => setGuests({ adults, children })}
            onClose={() => setActiveDropdown(null)}
          />
        )}

        {activeDropdown === 'tripType' && (
          <TripTypeDropdown
            value={tripType}
            onChange={(val) => {
              setTripType(val);
              setActiveDropdown(null);
            }}
            onClose={() => setActiveDropdown(null)}
          />
        )}

        {activeDropdown === 'travelStyle' && (
          <TravelStyleDropdown
            value={travelStyle}
            onChange={(val) => {
              setTravelStyle(val);
              setActiveDropdown(null);
            }}
            onClose={() => setActiveDropdown(null)}
          />
        )}
      </div>

      {/* ── Mobile CTA (< md) ──────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setIsOverlayOpen(true)}
        aria-label={t('search.open_planner')}
        data-testid="searchbar-mobile-cta"
        className="flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-green-dark text-[14px] font-semibold text-white shadow-lg transition-opacity hover:opacity-90 md:hidden"
      >
        <span className="icon-lucide">&#xe8b6;</span>
        {t('search.plan_my_trip')}
      </button>

      {/* ── Mobile full-screen overlay (< md) ──────────────────────────────── */}
      {isOverlayOpen && (
        <div
          data-testid="searchbar-overlay"
          className="fixed inset-0 z-[200] flex flex-col overflow-y-auto bg-white md:hidden"
        >
          <div className="flex items-center justify-between border-b border-gray-border px-6 py-4">
            <span className="text-[16px] font-semibold text-green-dark">
              {t('search.plan_my_trip')}
            </span>
            <button
              type="button"
              onClick={() => {
                setActiveDropdown(null);
                setIsOverlayOpen(false);
              }}
              aria-label={t('search.close_planner')}
              data-testid="searchbar-overlay-close"
              className="flex h-11 w-11 items-center justify-center rounded-full text-green-dark transition-colors hover:bg-gray-light"
            >
              <span className="icon-lucide text-xl" aria-hidden="true">
                &#xe1b2;
              </span>
            </button>
          </div>

          <div className="flex flex-1 flex-col gap-4 px-6 py-6">
            {/* Destination */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown('destination')}
                className="flex w-full flex-col items-start rounded-lg border border-gray-border bg-white px-4 py-3 text-left"
              >
                <span className={fieldLabelClass}>{t('search.destination')}</span>
                <span className={fieldValueClass}>
                  {destination?.name || t('search.destination_placeholder')}
                </span>
              </button>
              {activeDropdown === 'destination' && (
                <DestinationDropdown
                  mobile
                  value={destination?.name || ''}
                  onChange={(cityData) => {
                    setDestination(cityData);
                    setActiveDropdown(null);
                  }}
                  onClose={() => setActiveDropdown(null)}
                />
              )}
            </div>

            {/* Dates */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown('dates')}
                className="flex w-full items-center justify-between gap-4 rounded-lg border border-gray-border bg-white px-4 py-3 text-left"
              >
                <span className="flex flex-col">
                  <span className={fieldLabelClass}>{t('search.check_in')}</span>
                  <span className={fieldValueClass}>{dates.checkIn || t('search.add_date')}</span>
                </span>
                <span className="flex flex-col">
                  <span className={fieldLabelClass}>{t('search.check_out')}</span>
                  <span className={fieldValueClass}>{dates.checkOut || t('search.add_date')}</span>
                </span>
              </button>
              {activeDropdown === 'dates' && (
                <DatePickerDropdown
                  mobile
                  checkIn={dates.checkIn}
                  checkOut={dates.checkOut}
                  onChange={(checkIn, checkOut) => setDates({ checkIn, checkOut })}
                  onClose={() => setActiveDropdown(null)}
                />
              )}
            </div>

            {/* Guests */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown('guests')}
                className="flex w-full flex-col items-start rounded-lg border border-gray-border bg-white px-4 py-3 text-left"
              >
                <span className={fieldLabelClass}>{t('search.guests')}</span>
                <span className={fieldValueClass}>{guestsLabel}</span>
              </button>
              {activeDropdown === 'guests' && (
                <GuestsDropdown
                  mobile
                  adults={guests.adults}
                  kids={guests.children}
                  onChange={(adults, children) => setGuests({ adults, children })}
                  onClose={() => setActiveDropdown(null)}
                />
              )}
            </div>

            {/* Trip Type */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown('tripType')}
                className="flex w-full flex-col items-start rounded-lg border border-gray-border bg-white px-4 py-3 text-left"
              >
                <span className={fieldLabelClass}>{t('search.trip_type')}</span>
                <span className={fieldValueClass}>{tripType}</span>
              </button>
              {activeDropdown === 'tripType' && (
                <TripTypeDropdown
                  mobile
                  value={tripType}
                  onChange={(val) => {
                    setTripType(val);
                    setActiveDropdown(null);
                  }}
                  onClose={() => setActiveDropdown(null)}
                />
              )}
            </div>

            {/* Travel Style */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown('travelStyle')}
                className="flex w-full flex-col items-start rounded-lg border border-gray-border bg-white px-4 py-3 text-left"
              >
                <span className={fieldLabelClass}>{t('search.travel_style')}</span>
                <span className={fieldValueClass}>{travelStyle || t('search.any_style')}</span>
              </button>
              {activeDropdown === 'travelStyle' && (
                <TravelStyleDropdown
                  mobile
                  value={travelStyle}
                  onChange={(val) => {
                    setTravelStyle(val);
                    setActiveDropdown(null);
                  }}
                  onClose={() => setActiveDropdown(null)}
                />
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="border-t border-gray-border px-6 py-5">
            <button
              type="button"
              onClick={handleSearch}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-green-dark text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
            >
              <span className="icon-lucide">&#xe8b6;</span>
              {t('search.plan_my_trip')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
