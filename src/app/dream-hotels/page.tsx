'use client';

import { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Footer from '@/components/Footer';
import HotelMap from '@/components/HotelMap';
import PreviewBanner from '@/components/PreviewBanner';
import DraftBadge from '@/components/DraftBadge';
import EntityRatingBadge from '@/components/reviews/EntityRatingBadge';
import { apiClient } from '@/lib/api-client';
import { usePreviewMode } from '@/hooks/usePreviewMode';
import { useDebounce } from '@/hooks/useDebounce';
import { useDestinationSearch } from '@/hooks/useDestinationSearch';
import { useLanguage, type TranslationKeys } from '@/contexts/LanguageContext';
import { useInfiniteList } from '@/lib/use-infinite-list';
import { shouldShowDreamHotelsMap } from '@/lib/dream-hotels-map';
import { getLocalizedText } from '@/types/common';
import { getHotelImages, type Hotel } from '@/types/hotel';
import WishlistButton from '@/components/WishlistButton';
import type { DestinationSuggestion } from '@/types/destination';
import type { ReviewAggregate } from '@/types/review';

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

// Infinite-scroll page size (matches the backend hotels per_page cap).
const HOTELS_PER_PAGE = 50;

function destinationTypeLabelKey(type: string): TranslationKeys {
  switch (type) {
    case 'country':
      return 'destination.type_country';
    case 'region':
      return 'destination.type_region';
    case 'city':
    default:
      return 'destination.type_city';
  }
}

type DropdownType = 'type' | null;

function DreamHotelsContent() {
  const { t, lang } = useLanguage();
  const [reviewAggregates, setReviewAggregates] = useState<Record<number, ReviewAggregate>>({});

  const { isPreview } = usePreviewMode();

  // Filter state
  const [selectedStarRating, setSelectedStarRating] = useState('');

  // Unified destination search
  const [destinationSearch, setDestinationSearch] = useState('');
  const [selectedDestination, setSelectedDestination] = useState<DestinationSuggestion | null>(
    null,
  );
  const [isDestinationFocused, setIsDestinationFocused] = useState(false);
  const destinationRef = useRef<HTMLDivElement>(null);

  // Shared bookable-only destination search (same path as the home hero). A
  // blank query returns the top bookable destinations (initial state). Disabled
  // once a destination is selected so the dropdown collapses to the choice.
  const {
    suggestions: destinationSuggestions,
    isLoading: isLoadingSuggestions,
    isPopular: isPopularDestinations,
  } = useDestinationSearch(destinationSearch, {
    disabled: !!selectedDestination,
    language: lang,
    limit: 10,
  });

  // Hotel name search
  const [hotelSearch, setHotelSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebounce(hotelSearch, 300);

  // Dropdown open state
  const [openDropdown, setOpenDropdown] = useState<DropdownType>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Build destination filter params from selected destination (ID-based)
  const destinationFilter = useMemo(() => {
    if (!selectedDestination) return {};
    switch (selectedDestination.type) {
      case 'country':
        return { country_id: selectedDestination.id };
      case 'region':
        return { region_id: selectedDestination.id };
      case 'city':
        return { city_id: selectedDestination.id };
      default:
        return {};
    }
  }, [selectedDestination]);

  // Gate the map: only render once the user has expressed a location/name
  // signal (hotel-name search OR a selected destination). Star rating alone
  // does not qualify. Conditional render — NOT CSS-hidden — so Google Maps
  // never initializes for users who never see it.
  const shouldShowMap = useMemo(
    () => shouldShowDreamHotelsMap(debouncedSearch, selectedDestination),
    [debouncedSearch, selectedDestination],
  );

  const trimmedSearch = debouncedSearch.trim() || undefined;

  // Infinite scroll is always active, whether or not the map is rendered. The
  // map (when shown) renders the accumulated paginated list — as the user
  // scrolls and more pages load, the pin set grows to match. Changing any
  // resettable filter is encoded in the dependency array below — the hook
  // resets to page 1 and re-fetches, dropping any in-flight response.
  const fetchHotelsPage = useCallback(
    (page: number) =>
      apiClient.getHotels({
        language: lang,
        include_draft: isPreview,
        country_id: destinationFilter.country_id,
        region_id: destinationFilter.region_id,
        city_id: destinationFilter.city_id,
        star_rating: selectedStarRating || undefined,
        q: trimmedSearch,
        page,
        per_page: HOTELS_PER_PAGE,
      }),
    [
      lang,
      isPreview,
      destinationFilter.country_id,
      destinationFilter.region_id,
      destinationFilter.city_id,
      selectedStarRating,
      trimmedSearch,
    ],
  );

  const {
    items: hotels,
    hasMore,
    isLoading,
    isLoadingMore,
    sentinelRef,
  } = useInfiniteList<Hotel>(fetchHotelsPage, [
    lang,
    isPreview,
    destinationFilter.country_id,
    destinationFilter.region_id,
    destinationFilter.city_id,
    selectedStarRating,
    trimmedSearch,
  ]);

  // Fetch review aggregates for the visible hotels in a single batched call.
  // Runs separately from the hotel fetch so the map renders immediately;
  // badges appear when this data arrives.
  useEffect(() => {
    const hotelIds = hotels.map((hotel) => hotel.id);

    let cancelled = false;
    async function fetchAggregates() {
      if (hotelIds.length === 0) {
        setReviewAggregates({});
        return;
      }
      try {
        const aggregates = await apiClient.getReviewAggregates('hotel', hotelIds, lang);
        if (!cancelled) {
          setReviewAggregates(aggregates);
        }
      } catch (error) {
        console.error('Failed to load review aggregates:', error);
      }
    }

    fetchAggregates();
    return () => {
      cancelled = true;
    };
  }, [hotels, lang]);

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
    setSelectedStarRating('');
    setHotelSearch('');
    setOpenDropdown(null);
    setIsSearchFocused(false);
    setIsDestinationFocused(false);
  }, []);

  const handleSelectDestination = useCallback(
    (dest: DestinationSuggestion) => {
      setSelectedDestination(dest);
      setDestinationSearch(getLocalizedText(dest.name, lang));
      setIsDestinationFocused(false);
    },
    [lang],
  );

  const handleClearDestination = useCallback(() => {
    setSelectedDestination(null);
    setDestinationSearch('');
  }, []);

  return (
    <main className={`min-h-screen bg-gray-light ${isPreview ? 'pt-10' : ''}`}>
      <PreviewBanner />

      {/* Hero */}
      <section className="relative h-[720px] w-full overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1920&h=900&fit=crop"
          alt={t('dream_hotels.hero_alt')}
          fill
          sizes="100vw"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1E3D2F]/60 via-[#1E3D2F]/70 to-[#1E3D2F]/90" />

        {/* Hero Content */}
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
          <span className="mb-4 text-[11px] font-semibold tracking-[4px] text-gold">
            {t('discover.curated_collection')}
          </span>
          <h1 className="font-primary text-[36px] font-normal italic leading-tight text-white break-keep md:text-[48px] lg:text-[64px]">
            {t('dream_hotels.hero_title')}
          </h1>
          <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-white/60">
            {t('dream_hotels.hero_subtitle')}
          </p>
        </div>
      </section>

      {/* Discovery / Map Section */}
      <section className="bg-white">
        {/* Interactive Map — only rendered once the user has searched a hotel
            name or selected a destination. Conditionally mounted (not CSS-hidden)
            so Google Maps doesn't initialize / hold tiles for users who never
            see it. */}
        {shouldShowMap &&
          (isLoading ? (
            <div
              data-testid="map-loading"
              className="flex h-[520px] items-center justify-center bg-[#E8E4D8]"
            >
              <div className="text-center">
                <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-green-dark border-t-transparent"></div>
                <p className="text-[16px] font-medium text-green-dark">
                  {t('dream_hotels.loading')}
                </p>
              </div>
            </div>
          ) : (
            <div data-testid="hotel-map">
              <HotelMap hotels={hotels} reviewAggregates={reviewAggregates} />
            </div>
          ))}

        {/* Hotel Name Search */}
        <div className="px-6 pt-10 pb-0 sm:px-10 lg:px-20" ref={searchRef}>
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
                placeholder={t('dream_hotels.search_by_name')}
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
        <div className="px-6 py-6 sm:px-10 lg:px-20" ref={dropdownRef}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
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
                    {t('discover.destination_label')}
                  </p>
                  <div className="flex items-center">
                    <input
                      type="text"
                      placeholder={t('dream_hotels.search_location')}
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
                        data-testid="clear-destination"
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
                    {t(destinationTypeLabelKey(selectedDestination.type))}
                  </span>
                )}
              </div>
              {/* Destination suggestions dropdown — shows the bookable popular
                  set on focus (empty query) and ranked matches as the user
                  types, identical to the home hero. */}
              {isDestinationFocused && !selectedDestination && (
                <div
                  data-testid="destination-suggestions"
                  className="absolute left-0 top-full z-50 mt-2 w-full rounded-xl bg-white shadow-xl"
                >
                  {isLoadingSuggestions ? (
                    <div className="flex items-center justify-center py-6">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-green-dark border-t-transparent" />
                    </div>
                  ) : (
                    <div className="max-h-[320px] overflow-auto p-2">
                      <p className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-gray-400">
                        {isPopularDestinations
                          ? t('destination.popular_title')
                          : t('destination.title')}
                      </p>
                      {destinationSuggestions.map((dest) => (
                        <button
                          key={`${dest.type}-${dest.id}`}
                          onClick={() => handleSelectDestination(dest)}
                          className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-gray-50"
                        >
                          <div>
                            <p className="text-[14px] font-medium text-green-dark">
                              {getLocalizedText(dest.name, lang)}
                            </p>
                            {dest.country_name && (
                              <p className="text-[12px] text-gray-text">
                                {getLocalizedText(dest.country_name, lang)}
                                {dest.region_name
                                  ? ` · ${getLocalizedText(dest.region_name, lang)}`
                                  : ''}
                              </p>
                            )}
                          </div>
                          <span className="flex-shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-text">
                            {t(destinationTypeLabelKey(dest.type))}
                          </span>
                        </button>
                      ))}
                      {destinationSuggestions.length === 0 && (
                        <p className="px-3 py-4 text-center text-[13px] text-gray-500">
                          {t('destination.no_results')}
                        </p>
                      )}
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
                  {t('dream_hotels.hotel_type')}
                </p>
                <p className="text-[14px] font-medium text-green-dark">
                  {STAR_RATING_OPTIONS.find((o) => o.value === selectedStarRating)?.label ||
                    t('dream_hotels.all_types')}
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
                className="w-full rounded-lg border border-green-dark px-8 py-4 text-[13px] font-semibold text-green-dark transition-colors hover:bg-green-dark hover:text-white md:w-auto"
              >
                {t('discover.clear')}
              </button>
            ) : (
              <button className="w-full rounded-lg bg-green-dark px-8 py-4 text-[13px] font-semibold text-white md:w-auto">
                {t('discover.search')}
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

      {/* Grid-level loading affordance — shown when the map is hidden so users
          still get visible feedback during fetches (the in-map spinner is
          gone when the map isn't rendered). */}
      {isLoading && !shouldShowMap && (
        <div
          data-testid="grid-loading"
          className="flex items-center justify-center bg-gray-light pt-20"
        >
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-green-dark border-t-transparent"></div>
        </div>
      )}

      {/* Featured Hotels */}
      <section className="bg-gray-light px-6 py-16 sm:px-10 lg:px-20 lg:py-20">
        <div className="mb-12 text-center">
          <span className="text-[11px] font-semibold tracking-[4px] text-gold">
            {t('dream_hotels.curated_for_you')}
          </span>
          <h2 className="mt-3 font-primary text-[28px] italic text-green-dark md:text-[36px] lg:text-[42px]">
            {t('dream_hotels.featured_title')}
          </h2>
        </div>

        {isLoading && hotels.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-green-dark border-t-transparent"></div>
          </div>
        ) : hotels.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-gray-text">
              {hasActiveFilters ? t('dream_hotels.empty_no_match') : t('dream_hotels.empty_none')}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 text-[14px] font-medium text-gold underline hover:no-underline"
              >
                {t('dream_hotels.clear_all_filters')}
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
                    <div className="absolute right-3 top-3 z-10">
                      <WishlistButton hotelId={hotel.id} size="sm" />
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-primary text-[18px] font-semibold text-green-dark">
                      {getLocalizedText(hotel.name)}
                    </h3>
                    <p className="mt-1 text-[13px] text-gray-text">
                      {getLocalizedText(hotel.address)}
                    </p>
                    <EntityRatingBadge entityType="hotel" entityId={hotel.id} className="mt-2" />
                  </div>
                </Link>
              ))}
            </div>

            {/* Infinite scroll affordances — always active, including while the
                map is visible (scroll-to-load grows the map's pin set). */}
            {/* Sentinel: triggers the next page ~200px before the bottom. */}
            <div ref={sentinelRef} data-testid="infinite-sentinel" aria-hidden="true" />
            {isLoadingMore && (
              <div
                data-testid="loading-more"
                className="flex items-center justify-center gap-3 pt-10 text-[13px] text-gray-text"
              >
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-green-dark border-t-transparent" />
                {t('discover.loading_more')}
              </div>
            )}
            {!hasMore && !isLoadingMore && (
              <p
                data-testid="no-more-results"
                className="pt-10 text-center text-[13px] text-gray-text"
              >
                {t('discover.no_more_results')}
              </p>
            )}
          </>
        )}
      </section>

      {/* Partners Section */}
      <section className="bg-green-dark px-6 py-16 sm:px-10 lg:px-[100px] lg:py-20">
        <div className="text-center">
          <span className="text-[11px] font-semibold tracking-[4px] text-gold">
            {t('dream_hotels.trusted_partnerships')}
          </span>
          <h2 className="mt-3 font-primary text-[28px] italic text-[#FAF5EF] md:text-[36px] lg:text-[42px]">
            {t('dream_hotels.network_title')}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-relaxed text-white/50">
            {t('dream_hotels.network_body')}
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
          {t('dream_hotels.network_perks')}
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
