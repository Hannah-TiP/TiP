'use client';

import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Footer from '@/components/Footer';
import HotelMap from '@/components/HotelMap';
import PreviewBanner from '@/components/PreviewBanner';
import DraftBadge from '@/components/DraftBadge';
import { apiClient } from '@/lib/api-client';
import { usePreviewMode } from '@/hooks/usePreviewMode';
import { getLocalizedText } from '@/types/common';
import { getHotelImages, type Hotel } from '@/types/hotel';
import type { City } from '@/types/location';

const partners = [
  'VIRTUOSO',
  'FOUR SEASONS',
  'ĀMAN',
  'PENINSULA',
  'PARK HYATT',
  'EDITION',
  'MANDARIN ORIENTAL',
  'ROSEWOOD',
];

// Helper function to derive tag from hotel data
function getHotelTag(hotel: Hotel): string {
  if (!hotel.star_rating) return 'HOTEL';
  return `${hotel.star_rating} STAR`;
}

const STAR_RATING_OPTIONS = [
  { value: '', label: 'All types' },
  { value: '5', label: '5 Star' },
  { value: '4', label: '4 Star' },
];

function DreamHotelsContent() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isPreview } = usePreviewMode();

  // Filter state
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedStarRating, setSelectedStarRating] = useState('');

  // Dropdown open state
  const [openDropdown, setOpenDropdown] = useState<'destination' | 'type' | null>(null);

  // Destination search
  const [citySearch, setCitySearch] = useState('');
  const [cities, setCities] = useState<City[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadHotels() {
      try {
        setIsLoading(true);
        const data = await apiClient.getHotels({
          language: 'en',
          include_draft: isPreview,
        });
        setHotels(data);
      } catch (error) {
        console.error('Failed to load hotels:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadHotels();
  }, [isPreview]);

  // Load cities when destination dropdown opens
  useEffect(() => {
    if (openDropdown === 'destination' && cities.length === 0) {
      setCitiesLoading(true);
      apiClient
        .getCities('en')
        .then(setCities)
        .catch(() => {})
        .finally(() => setCitiesLoading(false));
    }
  }, [openDropdown, cities.length]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered hotels
  const filteredHotels = useMemo(() => {
    return hotels.filter((hotel) => {
      if (selectedCity && hotel.city_id !== selectedCity.id) return false;
      if (selectedStarRating && hotel.star_rating !== selectedStarRating) return false;
      return true;
    });
  }, [hotels, selectedCity, selectedStarRating]);

  const filteredCities = cities.filter((c) =>
    getLocalizedText(c.name).toLowerCase().includes(citySearch.toLowerCase()),
  );

  const hasActiveFilters = selectedCity || selectedStarRating;

  function clearFilters() {
    setSelectedCity(null);
    setSelectedStarRating('');
    setOpenDropdown(null);
  }

  return (
    <main className={`min-h-screen bg-gray-light ${isPreview ? 'pt-10' : ''}`}>
      <PreviewBanner />

      {/* Hero */}
      <section className="relative h-[720px] w-full overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1920&h=900&fit=crop"
          alt="Luxury hotel"
          fill
          sizes="100vw"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1E3D2F]/60 via-[#1E3D2F]/70 to-[#1E3D2F]/90" />

        {/* Nav */}
        <nav className="relative z-10 flex h-16 items-center justify-between px-[60px]">
          <Link href="/">
            <Image
              src="/bible_TIP_profil_400x400px.svg"
              alt="TiP"
              width={36}
              height={36}
              className="h-9"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </Link>
          <div className="flex items-center gap-8">
            <Link
              href="/dream-hotels"
              className="text-[11px] font-semibold tracking-[2px] text-white"
            >
              DREAM HOTELS
            </Link>
            <Link
              href="/more-dreams"
              className="text-[11px] font-medium tracking-[2px] text-white/70 hover:text-white"
            >
              MORE DREAMS
            </Link>
            <Link
              href="/insights"
              className="text-[11px] font-medium tracking-[2px] text-white/70 hover:text-white"
            >
              INSIGHTS
            </Link>
            <Link
              href="/my-page"
              className="text-[11px] font-medium tracking-[2px] text-white/70 hover:text-white"
            >
              MY PAGE
            </Link>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 flex h-[calc(100%-64px)] flex-col items-center justify-center text-center">
          <span className="mb-4 text-[11px] font-semibold tracking-[4px] text-gold">
            CURATED COLLECTION
          </span>
          <h1 className="font-primary text-[64px] font-normal italic leading-tight text-white">
            Dream Hotels
          </h1>
          <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-white/60">
            Discover the world&apos;s most extraordinary hotels, hand-selected for unparalleled
            luxury and unforgettable experiences.
          </p>
        </div>
      </section>

      {/* Discovery / Map Section */}
      <section className="bg-white">
        {/* Interactive Map */}
        {isLoading ? (
          <div className="flex h-[520px] items-center justify-center bg-[#E8E4D8]">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-green-dark border-t-transparent"></div>
              <p className="text-[16px] font-medium text-green-dark">Loading hotels...</p>
            </div>
          </div>
        ) : (
          <HotelMap hotels={filteredHotels} selectedCity={selectedCity} />
        )}

        {/* Search filters */}
        <div className="px-20 py-10" ref={dropdownRef}>
          <div className="flex items-center gap-4">
            {/* Destination filter */}
            <div className="relative flex-1">
              <button
                onClick={() => {
                  setOpenDropdown(openDropdown === 'destination' ? null : 'destination');
                  setCitySearch('');
                }}
                className={`w-full rounded-lg border bg-white px-5 py-4 text-left transition-colors ${
                  openDropdown === 'destination'
                    ? 'border-gold'
                    : 'border-gray-border hover:border-gray-400'
                }`}
              >
                <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                  DESTINATION
                </p>
                <p className="text-[14px] font-medium text-green-dark">
                  {selectedCity ? getLocalizedText(selectedCity.name) : 'All destinations'}
                </p>
              </button>
              {openDropdown === 'destination' && (
                <div className="absolute left-0 top-full z-50 mt-2 w-full rounded-xl bg-white shadow-xl">
                  <div className="border-b border-gray-100 p-4">
                    <input
                      type="text"
                      placeholder="Search destinations..."
                      value={citySearch}
                      onChange={(e) => setCitySearch(e.target.value)}
                      className="w-full rounded-lg bg-gray-50 px-4 py-3 text-[14px] text-green-dark outline-none placeholder:text-gray-400"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-[280px] overflow-auto p-2">
                    {citiesLoading ? (
                      <div className="flex items-center justify-center py-6">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-green-dark border-t-transparent" />
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setSelectedCity(null);
                            setOpenDropdown(null);
                          }}
                          className={`flex w-full items-center rounded-lg px-3 py-2.5 text-left text-[14px] transition-colors hover:bg-gray-50 ${
                            !selectedCity ? 'font-semibold text-gold' : 'text-green-dark'
                          }`}
                        >
                          All destinations
                        </button>
                        {filteredCities.map((city) => (
                          <button
                            key={city.id}
                            onClick={() => {
                              setSelectedCity(city);
                              setOpenDropdown(null);
                            }}
                            className={`flex w-full items-center rounded-lg px-3 py-2.5 text-left text-[14px] transition-colors hover:bg-gray-50 ${
                              selectedCity?.id === city.id
                                ? 'font-semibold text-gold'
                                : 'text-green-dark'
                            }`}
                          >
                            {getLocalizedText(city.name)}
                          </button>
                        ))}
                        {filteredCities.length === 0 && !citiesLoading && (
                          <p className="px-3 py-4 text-center text-[13px] text-gray-500">
                            No destinations found
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Hotel Type filter */}
            <div className="relative flex-1">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'type' ? null : 'type')}
                className={`w-full rounded-lg border bg-white px-5 py-4 text-left transition-colors ${
                  openDropdown === 'type'
                    ? 'border-gold'
                    : 'border-gray-border hover:border-gray-400'
                }`}
              >
                <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                  HOTEL TYPE
                </p>
                <p className="text-[14px] font-medium text-green-dark">
                  {STAR_RATING_OPTIONS.find((o) => o.value === selectedStarRating)?.label ||
                    'All types'}
                </p>
              </button>
              {openDropdown === 'type' && (
                <div className="absolute left-0 top-full z-50 mt-2 w-full rounded-xl bg-white p-2 shadow-xl">
                  {STAR_RATING_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSelectedStarRating(option.value);
                        setOpenDropdown(null);
                      }}
                      className={`flex w-full items-center rounded-lg px-3 py-2.5 text-left text-[14px] transition-colors hover:bg-gray-50 ${
                        selectedStarRating === option.value
                          ? 'font-semibold text-gold'
                          : 'text-green-dark'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Price Range — static placeholder */}
            <div className="flex-1 rounded-lg border border-gray-border bg-white px-5 py-4">
              <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                PRICE RANGE
              </p>
              <p className="text-[14px] font-medium text-green-dark">Any price</p>
            </div>

            {/* Clear / Search button */}
            {hasActiveFilters ? (
              <button
                onClick={clearFilters}
                className="rounded-lg border border-green-dark px-8 py-4 text-[13px] font-semibold text-green-dark transition-colors hover:bg-green-dark hover:text-white"
              >
                Clear
              </button>
            ) : (
              <button className="rounded-lg bg-green-dark px-8 py-4 text-[13px] font-semibold text-white">
                Search
              </button>
            )}
          </div>

          {/* Active filter count */}
          {hasActiveFilters && (
            <p className="mt-3 text-[13px] text-gray-text">
              Showing {filteredHotels.length} of {hotels.length} hotels
            </p>
          )}
        </div>
      </section>

      {/* Featured Hotels */}
      <section className="bg-gray-light px-20 py-20">
        <div className="mb-12 text-center">
          <span className="text-[11px] font-semibold tracking-[4px] text-gold">
            CURATED FOR YOU
          </span>
          <h2 className="mt-3 font-primary text-[42px] italic text-green-dark">
            Featured Hotels & Destinations
          </h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-green-dark border-t-transparent"></div>
          </div>
        ) : filteredHotels.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-gray-text">
              {hasActiveFilters
                ? 'No hotels match your filters.'
                : 'No hotels available at the moment.'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 text-[14px] font-medium text-gold underline hover:no-underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-6">
            {filteredHotels.map((hotel) => (
              <Link
                key={hotel.id}
                href={`/hotel/${hotel.slug}`}
                className={`group overflow-hidden rounded-xl bg-white shadow-sm transition-all hover:shadow-lg ${
                  hotel.status === 'draft' ? 'ring-2 ring-amber-400' : ''
                }`}
              >
                <div className="relative h-56 overflow-hidden">
                  <Image
                    src={getHotelImages(hotel)[0]}
                    alt={getLocalizedText(hotel.name)}
                    fill
                    sizes="(max-width: 768px) 100vw, 25vw"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold tracking-wider text-green-dark backdrop-blur-sm">
                    {getHotelTag(hotel)}
                  </div>
                  <DraftBadge status={hotel.status} />
                </div>
                <div className="p-5">
                  <h3 className="font-primary text-[18px] font-semibold text-green-dark">
                    {getLocalizedText(hotel.name)}
                  </h3>
                  <p className="mt-1 text-[13px] text-gray-text">
                    {getLocalizedText(hotel.address)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Partners Section */}
      <section className="bg-green-dark px-[100px] py-20">
        <div className="text-center">
          <span className="text-[11px] font-semibold tracking-[4px] text-gold">
            TRUSTED PARTNERSHIPS
          </span>
          <h2 className="mt-3 font-primary text-[42px] italic text-[#FAF5EF]">
            Our Global Luxury Hotel Network
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-relaxed text-white/50">
            Book through TiP / Paris Class and enjoy preferred rates, exclusive privileges, and
            benefits you won&apos;t find elsewhere.
          </p>
        </div>

        <div className="mx-auto mt-12 flex flex-wrap items-center justify-center gap-x-16 gap-y-6">
          {partners.map((partner) => (
            <span key={partner} className="text-[14px] font-semibold tracking-[3px] text-white/30">
              {partner}
            </span>
          ))}
        </div>

        <p className="mt-12 text-center text-[14px] leading-relaxed text-white/40">
          Reserve with us to unlock the maximum benefits, preferred access, and exclusive savings —
          at the same price or better.
        </p>
      </section>

      <Footer />
    </main>
  );
}

export default function DreamHotelsPage() {
  return (
    <Suspense>
      <DreamHotelsContent />
    </Suspense>
  );
}
