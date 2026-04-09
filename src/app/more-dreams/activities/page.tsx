'use client';

import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Footer from '@/components/Footer';
import PreviewBanner from '@/components/PreviewBanner';
import DraftBadge from '@/components/DraftBadge';
import { apiClient } from '@/lib/api-client';
import { usePreviewMode } from '@/hooks/usePreviewMode';
import { getImageUrl, getLocalizedText } from '@/types/common';
import type { Activity } from '@/types/activity';
import type { City } from '@/types/location';

const CATEGORY_OPTIONS = [
  { value: '', label: 'All categories' },
  { value: 'sightseeing', label: 'Sightseeing' },
  { value: 'museum', label: 'Museum' },
  { value: 'show', label: 'Show' },
  { value: 'food', label: 'Food' },
  { value: 'wellness', label: 'Wellness' },
  { value: 'adventure', label: 'Adventure' },
  { value: 'culture', label: 'Culture' },
];

function getActivityTag(activity: Activity): string {
  if (!activity.category) return 'ACTIVITY';
  return activity.category.toUpperCase();
}

function ActivitiesContent() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isPreview } = usePreviewMode();

  // Filter state
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('');

  // Dropdown open state
  const [openDropdown, setOpenDropdown] = useState<'destination' | 'category' | null>(null);

  // Destination search
  const [citySearch, setCitySearch] = useState('');
  const [cities, setCities] = useState<City[]>([]);
  const [citiesLoading] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadActivities() {
      try {
        setIsLoading(true);
        const [activityData, cityData] = await Promise.all([
          apiClient.getActivities({
            language: 'en',
            include_draft: isPreview,
          }),
          apiClient.getCities('en'),
        ]);
        setActivities(activityData);
        setCities(cityData);
      } catch (error) {
        console.error('Failed to load activities:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadActivities();
  }, [isPreview]);

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

  // City name lookup
  const cityNameById = useMemo(() => {
    return new Map(cities.map((city) => [city.id, getLocalizedText(city.name)]));
  }, [cities]);

  // Filtered activities
  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      if (selectedCity && activity.city_id !== selectedCity.id) return false;
      if (selectedCategory && activity.category !== selectedCategory) return false;
      return true;
    });
  }, [activities, selectedCity, selectedCategory]);

  const filteredCities = cities.filter((c) =>
    getLocalizedText(c.name).toLowerCase().includes(citySearch.toLowerCase()),
  );

  const hasActiveFilters = selectedCity || selectedCategory;

  function clearFilters() {
    setSelectedCity(null);
    setSelectedCategory('');
    setOpenDropdown(null);
  }

  return (
    <main className={`min-h-screen bg-gray-light ${isPreview ? 'pt-10' : ''}`}>
      <PreviewBanner />

      {/* Hero */}
      <section className="relative h-[720px] w-full overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1920&h=900&fit=crop"
          alt="Luxury experiences"
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
              className="text-[11px] font-medium tracking-[2px] text-white/70 hover:text-white"
            >
              DREAM HOTELS
            </Link>
            <Link
              href="/more-dreams"
              className="text-[11px] font-semibold tracking-[2px] text-white"
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
            EXTRAORDINARY EXPERIENCES
          </span>
          <h1 className="font-primary text-[64px] font-normal italic leading-tight text-white">
            Dream Activities
          </h1>
          <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-white/60">
            Discover the world&apos;s most captivating experiences, from cultural landmarks to
            unforgettable adventures, hand-selected for the discerning traveler.
          </p>
        </div>
      </section>

      {/* Search filters */}
      <section className="bg-white px-20 py-10" ref={dropdownRef}>
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

          {/* Category filter */}
          <div className="relative flex-1">
            <button
              onClick={() => setOpenDropdown(openDropdown === 'category' ? null : 'category')}
              className={`w-full rounded-lg border bg-white px-5 py-4 text-left transition-colors ${
                openDropdown === 'category'
                  ? 'border-gold'
                  : 'border-gray-border hover:border-gray-400'
              }`}
            >
              <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                CATEGORY
              </p>
              <p className="text-[14px] font-medium text-green-dark">
                {CATEGORY_OPTIONS.find((o) => o.value === selectedCategory)?.label ||
                  'All categories'}
              </p>
            </button>
            {openDropdown === 'category' && (
              <div className="absolute left-0 top-full z-50 mt-2 w-full rounded-xl bg-white p-2 shadow-xl">
                {CATEGORY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSelectedCategory(option.value);
                      setOpenDropdown(null);
                    }}
                    className={`flex w-full items-center rounded-lg px-3 py-2.5 text-left text-[14px] transition-colors hover:bg-gray-50 ${
                      selectedCategory === option.value
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
            Showing {filteredActivities.length} of {activities.length} activities
          </p>
        )}
      </section>

      {/* Activities Grid */}
      <section className="bg-gray-light px-20 py-20">
        <div className="mb-12 text-center">
          <span className="text-[11px] font-semibold tracking-[4px] text-gold">
            CURATED FOR YOU
          </span>
          <h2 className="mt-3 font-primary text-[42px] italic text-green-dark">
            Featured Activities & Experiences
          </h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-green-dark border-t-transparent"></div>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-gray-text">
              {hasActiveFilters
                ? 'No activities match your filters.'
                : 'No activities available at the moment.'}
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
            {filteredActivities.map((activity) => (
              <Link
                key={activity.id}
                href={`/activity/${activity.slug}`}
                className={`group overflow-hidden rounded-xl bg-white shadow-sm transition-all hover:shadow-lg ${
                  activity.status === 'draft' ? 'ring-2 ring-amber-400' : ''
                }`}
              >
                <div className="relative h-56 overflow-hidden">
                  <Image
                    src={getImageUrl(activity.images?.[0])}
                    alt={getLocalizedText(activity.name)}
                    fill
                    sizes="(max-width: 768px) 100vw, 25vw"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold tracking-wider text-green-dark backdrop-blur-sm">
                    {getActivityTag(activity)}
                  </div>
                  <DraftBadge status={activity.status} />
                </div>
                <div className="p-5">
                  <h3 className="font-primary text-[18px] font-semibold text-green-dark">
                    {getLocalizedText(activity.name)}
                  </h3>
                  {activity.city_id && cityNameById.get(activity.city_id) && (
                    <p className="mt-1 text-[13px] text-gray-text">
                      {cityNameById.get(activity.city_id)}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="bg-green-dark px-[100px] py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[11px] font-semibold tracking-[4px] text-gold">
            PERSONAL CONCIERGE
          </span>
          <h2 className="mt-3 font-primary text-[42px] italic text-[#FAF5EF]">
            Let TiP Curate Your Perfect Experience
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-relaxed text-white/50">
            From cultural landmarks to hidden gems — tell us your dream and we&apos;ll craft the
            perfect itinerary.
          </p>
          <Link
            href="/concierge"
            className="mt-8 inline-block rounded-lg bg-white px-8 py-4 text-[13px] font-semibold text-green-dark transition-colors hover:bg-white/90"
          >
            Start Planning
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}

export default function ActivitiesPage() {
  return (
    <Suspense>
      <ActivitiesContent />
    </Suspense>
  );
}
