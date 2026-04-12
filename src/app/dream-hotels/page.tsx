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
import type { City, Country, Region } from '@/types/location';

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

type DropdownType = 'country' | 'destination' | 'type' | null;

function DreamHotelsContent() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [totalHotelCount, setTotalHotelCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const { isPreview } = usePreviewMode();

  // Filter state
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedStarRating, setSelectedStarRating] = useState('');

  // Hotel name search
  const [hotelSearch, setHotelSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebounce(hotelSearch, 300);

  // Dropdown open state
  const [openDropdown, setOpenDropdown] = useState<DropdownType>(null);

  // Country data (loaded once for dropdowns)
  const [countries, setCountries] = useState<Country[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [countrySearch, setCountrySearch] = useState('');
  const [locationDataLoading, setLocationDataLoading] = useState(false);

  // Destination search
  const [citySearch, setCitySearch] = useState('');
  const [cities, setCities] = useState<City[]>([]);
  const citiesLoading = locationDataLoading;

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch hotels with current filters (server-side filtering)
  const fetchHotels = useCallback(
    async (params: { country_id?: number; city_id?: number; star_rating?: string; q?: string }) => {
      try {
        setIsLoading(true);
        const data = await apiClient.getHotels({
          language: 'en',
          include_draft: isPreview,
          country_id: params.country_id,
          city_id: params.city_id,
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

  // Fetch total hotel count on mount (unfiltered)
  useEffect(() => {
    async function loadTotalCount() {
      try {
        const data = await apiClient.getHotels({
          language: 'en',
          include_draft: isPreview,
        });
        setTotalHotelCount(data.length);
      } catch {
        // ignore
      }
    }
    loadTotalCount();
  }, [isPreview]);

  // Re-fetch hotels when filters change
  useEffect(() => {
    fetchHotels({
      country_id: selectedCountry?.id,
      city_id: selectedCity?.id,
      star_rating: selectedStarRating,
      q: debouncedSearch.trim() || undefined,
    });
  }, [selectedCountry?.id, selectedCity?.id, selectedStarRating, debouncedSearch, fetchHotels]);

  // Load location data (countries, regions, cities) on mount for dropdowns
  useEffect(() => {
    async function loadLocationData() {
      setLocationDataLoading(true);
      try {
        const [countriesData, regionsData, citiesData] = await Promise.all([
          apiClient.getCountries(),
          apiClient.getRegions('en'),
          apiClient.getCities('en'),
        ]);
        setCountries(countriesData);
        setRegions(regionsData);
        setCities(citiesData);
      } catch (error) {
        console.error('Failed to load location data:', error);
      } finally {
        setLocationDataLoading(false);
      }
    }

    loadLocationData();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Build city-to-country mapping: city_id -> country_id
  const cityToCountryMap = useMemo(() => {
    const regionToCountry = new Map<number, number>();
    for (const region of regions) {
      regionToCountry.set(region.id, region.country_id);
    }

    const cityToCountry = new Map<number, number>();
    for (const city of cities) {
      const countryId = regionToCountry.get(city.region_id);
      if (countryId !== undefined) {
        cityToCountry.set(city.id, countryId);
      }
    }
    return cityToCountry;
  }, [regions, cities]);

  // Get countries that have hotels (use total hotel list for dropdown display)
  const countriesWithHotels = useMemo(() => {
    // When we have hotels loaded, derive which countries have them
    const countryIdsWithHotels = new Set<number>();
    for (const hotel of hotels) {
      if (hotel.city_id) {
        const countryId = cityToCountryMap.get(hotel.city_id);
        if (countryId !== undefined) {
          countryIdsWithHotels.add(countryId);
        }
      }
    }
    // If no filters active and we have hotels, use the hotel data
    // Otherwise show all countries (user may want to explore)
    if (countryIdsWithHotels.size > 0) {
      return countries.filter((c) => countryIdsWithHotels.has(c.id));
    }
    return countries;
  }, [hotels, countries, cityToCountryMap]);

  // Get cities filtered by selected country
  const citiesForSelectedCountry = useMemo(() => {
    if (!selectedCountry) return cities;
    return cities.filter((city) => {
      const countryId = cityToCountryMap.get(city.id);
      return countryId === selectedCountry.id;
    });
  }, [cities, selectedCountry, cityToCountryMap]);

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

  const filteredCities = citiesForSelectedCountry.filter((c) =>
    getLocalizedText(c.name).toLowerCase().includes(citySearch.toLowerCase()),
  );

  const filteredCountries = countriesWithHotels.filter((c) =>
    getLocalizedText(c.name).toLowerCase().includes(countrySearch.toLowerCase()),
  );

  const hasActiveFilters =
    selectedCountry || selectedCity || selectedStarRating || hotelSearch.trim();

  const clearFilters = useCallback(() => {
    setSelectedCountry(null);
    setSelectedCity(null);
    setSelectedStarRating('');
    setHotelSearch('');
    setOpenDropdown(null);
    setIsSearchFocused(false);
  }, []);

  const handleSelectCountry = useCallback(
    (country: Country | null) => {
      setSelectedCountry(country);
      // Clear city if it doesn't belong to the new country
      if (country && selectedCity) {
        const cityCountryId = cityToCountryMap.get(selectedCity.id);
        if (cityCountryId !== country.id) {
          setSelectedCity(null);
        }
      }
      setOpenDropdown(null);
    },
    [selectedCity, cityToCountryMap],
  );

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
            {/* Country filter */}
            <div className="relative flex-1">
              <button
                onClick={() => {
                  setOpenDropdown(openDropdown === 'country' ? null : 'country');
                  setCountrySearch('');
                }}
                className={`w-full rounded-lg border bg-white px-5 py-4 text-left transition-colors ${
                  openDropdown === 'country'
                    ? 'border-gold'
                    : 'border-gray-border hover:border-gray-400'
                }`}
              >
                <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                  COUNTRY
                </p>
                <p className="text-[14px] font-medium text-green-dark">
                  {selectedCountry ? getLocalizedText(selectedCountry.name) : 'All countries'}
                </p>
              </button>
              {openDropdown === 'country' && (
                <div className="absolute left-0 top-full z-50 mt-2 w-full rounded-xl bg-white shadow-xl">
                  <div className="border-b border-gray-100 p-4">
                    <input
                      type="text"
                      placeholder="Search countries..."
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      className="w-full rounded-lg bg-gray-50 px-4 py-3 text-[14px] text-green-dark outline-none placeholder:text-gray-400"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-[280px] overflow-auto p-2">
                    {locationDataLoading ? (
                      <div className="flex items-center justify-center py-6">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-green-dark border-t-transparent" />
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleSelectCountry(null)}
                          className={`flex w-full items-center rounded-lg px-3 py-2.5 text-left text-[14px] transition-colors hover:bg-gray-50 ${
                            !selectedCountry ? 'font-semibold text-gold' : 'text-green-dark'
                          }`}
                        >
                          All countries
                        </button>
                        {filteredCountries.map((country) => (
                          <button
                            key={country.id}
                            onClick={() => handleSelectCountry(country)}
                            className={`flex w-full items-center rounded-lg px-3 py-2.5 text-left text-[14px] transition-colors hover:bg-gray-50 ${
                              selectedCountry?.id === country.id
                                ? 'font-semibold text-gold'
                                : 'text-green-dark'
                            }`}
                          >
                            {getLocalizedText(country.name)}
                          </button>
                        ))}
                        {filteredCountries.length === 0 && !locationDataLoading && (
                          <p className="px-3 py-4 text-center text-[13px] text-gray-500">
                            No countries found
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

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
              Showing {hotels.length} of {totalHotelCount} hotels
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
