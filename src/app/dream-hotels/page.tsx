'use client';

import { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Footer from '@/components/Footer';
import HotelMap from '@/components/HotelMap';
import PreviewBanner from '@/components/PreviewBanner';
import DraftBadge from '@/components/DraftBadge';
import { apiClient } from '@/lib/api-client';
import { usePreviewMode } from '@/hooks/usePreviewMode';
import { useDebounce } from '@/hooks/useDebounce';
import { getLocalizedText } from '@/types/common';
import { getHotelImages, type Hotel } from '@/types/hotel';
import type { DestinationSuggestion } from '@/types/destination';

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

function getDestinationTypeLabel(type: string): string {
  switch (type) {
    case 'country':
      return 'Country';
    case 'region':
      return 'Region';
    case 'city':
      return 'City';
    default:
      return '';
  }
}

type DropdownType = 'type' | null;

function DreamHotelsContent() {
  const [hotels, setHotels] = useState<Hotel[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const { isPreview } = usePreviewMode();

  // Filter state
  const [selectedStarRating, setSelectedStarRating] = useState('');

  // Unified destination search
  const [destinationSearch, setDestinationSearch] = useState('');
  const [selectedDestination, setSelectedDestination] = useState<DestinationSuggestion | null>(
    null,
  );
  const [destinationSuggestions, setDestinationSuggestions] = useState<DestinationSuggestion[]>([]);
  const [isDestinationFocused, setIsDestinationFocused] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const destinationRef = useRef<HTMLDivElement>(null);
  const debouncedDestination = useDebounce(destinationSearch, 300);

  // Hotel name search
  const [hotelSearch, setHotelSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebounce(hotelSearch, 300);

  // Dropdown open state
  const [openDropdown, setOpenDropdown] = useState<DropdownType>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch destination suggestions
  useEffect(() => {
    if (!debouncedDestination.trim() || selectedDestination) {
      setDestinationSuggestions([]);
      return;
    }

    let cancelled = false;
    async function fetchSuggestions() {
      setIsLoadingSuggestions(true);
      try {
        const results = await apiClient.searchDestinations(debouncedDestination.trim(), {
          limit: 10,
        });
        if (!cancelled) {
          setDestinationSuggestions(results);
        }
      } catch (error) {
        console.error('Failed to search destinations:', error);
      } finally {
        if (!cancelled) {
          setIsLoadingSuggestions(false);
        }
      }
    }

    fetchSuggestions();
    return () => {
      cancelled = true;
    };
  }, [debouncedDestination, selectedDestination]);

  // Fetch hotels with current filters (server-side filtering)
  const fetchHotels = useCallback(
    async (params: { destination?: string; star_rating?: string; q?: string }) => {
      try {
        setIsLoading(true);
        const data = await apiClient.getHotels({
          language: 'en',
          include_draft: isPreview,
          destination: params.destination || undefined,
          star_rating: params.star_rating || undefined,
          q: params.q || undefined,
        });
        setHotels(data);
      } catch (error) {
        console.error('Failed to load hotels:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [isPreview],
  );

  // Build destination query from selected destination
  const destinationQuery = useMemo(() => {
    if (!selectedDestination) return undefined;
    return getLocalizedText(selectedDestination.name);
  }, [selectedDestination]);

  // Re-fetch hotels when filters change
  useEffect(() => {
    fetchHotels({
      destination: destinationQuery,
      star_rating: selectedStarRating,
      q: debouncedSearch.trim() || undefined,
    });
  }, [destinationQuery, selectedStarRating, debouncedSearch, fetchHotels]);

  // Close dropdown / suggestion panel on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
      if (destinationRef.current && !destinationRef.current.contains(e.target as Node)) {
        setIsDestinationFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Autocomplete suggestions from current hotel results
  const hotelSuggestions = useMemo(() => {
    if (!hotelSearch.trim() || hotelSearch.trim().length < 1) return [];
    const searchLower = hotelSearch.trim().toLowerCase();
    return hotels
      .filter((hotel) => {
        const hotelName = getLocalizedText(hotel.name).toLowerCase();
        return hotelName.includes(searchLower);
      })
      .slice(0, 8);
  }, [hotels, hotelSearch]);

  const hasActiveFilters = selectedDestination || selectedStarRating || hotelSearch.trim();

  const clearFilters = useCallback(() => {
    setSelectedDestination(null);
    setDestinationSearch('');
    setDestinationSuggestions([]);
    setSelectedStarRating('');
    setHotelSearch('');
    setOpenDropdown(null);
    setIsSearchFocused(false);
    setIsDestinationFocused(false);
  }, []);

  const handleSelectDestination = useCallback((dest: DestinationSuggestion) => {
    setSelectedDestination(dest);
    setDestinationSearch(getLocalizedText(dest.name));
    setDestinationSuggestions([]);
    setIsDestinationFocused(false);
  }, []);

  const handleClearDestination = useCallback(() => {
    setSelectedDestination(null);
    setDestinationSearch('');
    setDestinationSuggestions([]);
  }, []);

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
          <HotelMap hotels={hotels} />
        )}

        {/* Hotel Name Search */}
        <div className="px-20 pt-10 pb-0" ref={searchRef}>
          <div className="relative">
            <div className="relative">
              <svg
                className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search hotels by name..."
                value={hotelSearch}
                onChange={(e) => setHotelSearch(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                className="w-full rounded-lg border border-gray-border bg-white py-4 pl-12 pr-10 text-[14px] text-green-dark outline-none transition-colors placeholder:text-gray-400 focus:border-gold"
              />
              {hotelSearch && (
                <button
                  onClick={() => {
                    setHotelSearch('');
                    setIsSearchFocused(false);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-dark"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
            {/* Autocomplete suggestions */}
            {isSearchFocused && hotelSuggestions.length > 0 && (
              <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-xl bg-white shadow-xl">
                <div className="max-h-[320px] overflow-auto p-2">
                  {hotelSuggestions.map((hotel) => (
                    <Link
                      key={hotel.id}
                      href={`/hotel/${hotel.slug}`}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-gray-50"
                      onClick={() => setIsSearchFocused(false)}
                    >
                      <div className="relative h-10 w-14 flex-shrink-0 overflow-hidden rounded">
                        <Image
                          src={getHotelImages(hotel)[0]}
                          alt={getLocalizedText(hotel.name)}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-[14px] font-medium text-green-dark">
                          {getLocalizedText(hotel.name)}
                        </p>
                        <p className="text-[12px] text-gray-text">
                          {getLocalizedText(hotel.address)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search filters */}
        <div className="px-20 py-6" ref={dropdownRef}>
          <div className="flex items-center gap-4">
            {/* Unified Destination filter */}
            <div className="relative flex-[2]" ref={destinationRef}>
              <div className="relative">
                <div
                  className={`w-full rounded-lg border bg-white px-5 py-3 transition-colors ${
                    isDestinationFocused
                      ? 'border-gold'
                      : 'border-gray-border hover:border-gray-400'
                  }`}
                >
                  <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                    DESTINATION
                  </p>
                  <div className="flex items-center">
                    <input
                      type="text"
                      placeholder="Search country, region, or city..."
                      value={destinationSearch}
                      onChange={(e) => {
                        setDestinationSearch(e.target.value);
                        if (selectedDestination) {
                          setSelectedDestination(null);
                        }
                      }}
                      onFocus={() => setIsDestinationFocused(true)}
                      className="w-full bg-transparent text-[14px] font-medium text-green-dark outline-none placeholder:font-normal placeholder:text-gray-400"
                    />
                    {(destinationSearch || selectedDestination) && (
                      <button
                        onClick={handleClearDestination}
                        className="ml-2 flex-shrink-0 text-gray-400 hover:text-green-dark"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                {selectedDestination && (
                  <span className="absolute right-12 top-1/2 -translate-y-1/2 rounded-full bg-gold/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold">
                    {getDestinationTypeLabel(selectedDestination.type)}
                  </span>
                )}
              </div>
              {/* Destination suggestions dropdown */}
              {isDestinationFocused &&
                !selectedDestination &&
                (destinationSuggestions.length > 0 || isLoadingSuggestions) && (
                  <div className="absolute left-0 top-full z-50 mt-2 w-full rounded-xl bg-white shadow-xl">
                    {isLoadingSuggestions ? (
                      <div className="flex items-center justify-center py-6">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-green-dark border-t-transparent" />
                      </div>
                    ) : (
                      <div className="max-h-[320px] overflow-auto p-2">
                        {destinationSuggestions.map((dest) => (
                          <button
                            key={`${dest.type}-${dest.id}`}
                            onClick={() => handleSelectDestination(dest)}
                            className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-gray-50"
                          >
                            <div>
                              <p className="text-[14px] font-medium text-green-dark">
                                {getLocalizedText(dest.name)}
                              </p>
                              {dest.country_name && (
                                <p className="text-[12px] text-gray-text">
                                  {getLocalizedText(dest.country_name)}
                                  {dest.region_name
                                    ? ` · ${getLocalizedText(dest.region_name)}`
                                    : ''}
                                </p>
                              )}
                            </div>
                            <span className="flex-shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-text">
                              {getDestinationTypeLabel(dest.type)}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
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
              {hotels.length} {hotels.length === 1 ? 'hotel' : 'hotels'} found
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
        ) : hotels.length === 0 ? (
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
            {hotels.map((hotel) => (
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
