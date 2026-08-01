'use client';

import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Footer from '@/components/Footer';
import SignatureJourneyCard from '@/components/signature-journey/SignatureJourneyCard';
import { apiClient } from '@/lib/api-client';
import { getLocalizedText } from '@/types/common';
import { useLanguage } from '@/contexts/LanguageContext';
import { buildSuggestions, deriveRelatedCities } from '@/lib/signature-journey-search';
import type { CitySuggestion } from '@/lib/signature-journey-search';
import type { SignatureJourney } from '@/types/signatureJourney';
import type { City } from '@/types/location';

/** Debounce window for the server-side `q` search. */
const SEARCH_DEBOUNCE_MS = 280;

function SignatureJourneysContent() {
  const [signatureJourneys, setSignatureJourneys] = useState<SignatureJourney[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t, lang } = useLanguage();

  // Unified typeahead state (SMA-229). `query` drives a debounced server search
  // over journey titles AND city names; picking a suggestion narrows the grid.
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SignatureJourney[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCity, setSelectedCity] = useState<CitySuggestion | null>(null);
  const [selectedJourney, setSelectedJourney] = useState<SignatureJourney | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const requestSeq = useRef(0);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        // signature_journeys_v2 list endpoint (SMA-206) — published-only.
        const [journeyData, cityData] = await Promise.all([
          apiClient.getSignatureJourneys({ language: lang, per_page: 100 }),
          apiClient.getCities(lang),
        ]);
        setSignatureJourneys(journeyData.items);
        setCities(cityData);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [lang]);

  const trimmedQuery = query.trim();

  // Debounced `q` search with a sequence-number stale-response guard, so fast
  // typing can never render results for an earlier prefix.
  useEffect(() => {
    const seq = ++requestSeq.current;

    if (!trimmedQuery) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      apiClient
        .getSignatureJourneys({ q: trimmedQuery, language: lang, per_page: 100 })
        .then((data) => {
          if (seq !== requestSeq.current) return;
          setSearchResults(data.items);
          setIsSearching(false);
        })
        .catch(() => {
          if (seq !== requestSeq.current) return;
          setSearchResults([]);
          setIsSearching(false);
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [trimmedQuery, lang]);

  // Close the suggestion panel on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsPanelOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Only cities with at least one published journey are ever offered.
  const relatedCities = useMemo(
    () => deriveRelatedCities(signatureJourneys, cities),
    [signatureJourneys, cities],
  );

  const cityNameById = useMemo(
    () => new Map(relatedCities.map((city) => [city.id, getLocalizedText(city.name, lang)])),
    [relatedCities, lang],
  );

  const suggestions = useMemo(
    () => buildSuggestions(searchResults ?? signatureJourneys, cityNameById, lang),
    [searchResults, signatureJourneys, cityNameById, lang],
  );

  const hasSuggestions = suggestions.cities.length > 0 || suggestions.journeys.length > 0;

  // Single source of truth for the grid: a picked journey wins, then the server
  // results for an active query, then the selected city, then everything.
  const filteredSignatureJourneys = useMemo(() => {
    if (selectedJourney) return [selectedJourney];
    if (trimmedQuery) return searchResults ?? [];
    if (selectedCity) return signatureJourneys.filter((j) => j.city_id === selectedCity.id);
    return signatureJourneys;
  }, [selectedJourney, trimmedQuery, searchResults, selectedCity, signatureJourneys]);

  const hasActiveFilter = Boolean(trimmedQuery || selectedCity || selectedJourney);

  function handleQueryChange(value: string) {
    setQuery(value);
    setSelectedJourney(null);
    setSelectedCity(null);
    setIsPanelOpen(true);
  }

  function handleSelectCity(city: CitySuggestion) {
    setSelectedCity(city);
    setSelectedJourney(null);
    setQuery('');
    setIsPanelOpen(false);
  }

  function handleSelectJourney(journeyId: number) {
    const pool = searchResults ?? signatureJourneys;
    const journey = pool.find((j) => j.id === journeyId);
    if (!journey) return;
    setSelectedJourney(journey);
    setSelectedCity(null);
    setQuery(getLocalizedText(journey.title, lang));
    setIsPanelOpen(false);
  }

  function handleClear() {
    setQuery('');
    setSelectedCity(null);
    setSelectedJourney(null);
    setIsPanelOpen(false);
  }

  return (
    <main className="min-h-screen bg-gray-light">
      {/* Hero */}
      <section className="relative h-[720px] w-full overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1505228395891-9a51e7e86bf6?w=1920&h=900&fit=crop"
          alt={t('signature_journeys.hero_alt')}
          fill
          sizes="100vw"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1E3D2F]/60 via-[#1E3D2F]/70 to-[#1E3D2F]/90" />

        {/* Hero Content */}
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
          <span className="mb-4 text-[11px] font-semibold tracking-[4px] text-gold">
            {t('signature_journeys.hero_overline')}
          </span>
          <h1 className="font-primary text-[36px] font-normal italic leading-tight text-white break-keep md:text-[48px] lg:text-[64px]">
            {t('signature_journeys.hero_title')}
          </h1>
          <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-white/60">
            {t('signature_journeys.hero_subtitle')}
          </p>
        </div>
      </section>

      {/* Unified name search — matches city names AND journey titles (SMA-229) */}
      <section className="bg-white px-6 py-10 sm:px-10 lg:px-20" ref={dropdownRef}>
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <div className="rounded-lg border border-gray-border bg-white px-5 py-3 transition-colors focus-within:border-gold">
              <label
                htmlFor="signature-journey-search"
                className="block text-[10px] font-medium uppercase tracking-wider text-gray-400"
              >
                {t('signature_journeys.search_label')}
              </label>
              <input
                id="signature-journey-search"
                data-testid="signature-journey-search"
                type="text"
                autoComplete="off"
                placeholder={t('signature_journeys.search_placeholder')}
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                onFocus={() => setIsPanelOpen(true)}
                className="w-full bg-transparent text-[14px] font-medium text-green-dark outline-none placeholder:font-normal placeholder:text-gray-400"
              />
            </div>

            {/* The panel only opens when it has something to offer — a
                zero-match search is reported by the grid empty state. */}
            {isPanelOpen && (isSearching || hasSuggestions) && (
              <div
                className="absolute left-0 top-full z-50 mt-2 max-h-[320px] w-full overflow-auto rounded-xl bg-white p-2 shadow-xl"
                data-testid="signature-journey-suggestions"
              >
                {isSearching && !hasSuggestions ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-green-dark border-t-transparent" />
                  </div>
                ) : (
                  <>
                    {suggestions.cities.length > 0 && (
                      <div className="mb-1">
                        <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                          {t('signature_journeys.suggestions_cities')}
                        </p>
                        {suggestions.cities.map((city) => (
                          <button
                            key={`city-${city.id}`}
                            data-testid="suggestion-city"
                            onClick={() => handleSelectCity(city)}
                            className="flex w-full items-center rounded-lg px-3 py-2.5 text-left text-[14px] text-green-dark transition-colors hover:bg-gray-50"
                          >
                            {city.name}
                          </button>
                        ))}
                      </div>
                    )}
                    {suggestions.journeys.length > 0 && (
                      <div>
                        <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                          {t('signature_journeys.suggestions_journeys')}
                        </p>
                        {suggestions.journeys.map((journey) => (
                          <button
                            key={`journey-${journey.id}`}
                            data-testid="suggestion-journey"
                            onClick={() => handleSelectJourney(journey.id)}
                            className="flex w-full flex-col items-start rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-gray-50"
                          >
                            <span className="text-[14px] text-green-dark">{journey.title}</span>
                            {journey.cityName && (
                              <span className="text-[12px] text-gray-text">{journey.cityName}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {hasActiveFilter && (
            <button
              onClick={handleClear}
              data-testid="signature-journey-clear"
              className="rounded-lg border border-green-dark px-8 py-4 text-[13px] font-semibold text-green-dark transition-colors hover:bg-green-dark hover:text-white"
            >
              {t('signature_journeys.clear_search')}
            </button>
          )}
        </div>

        {selectedCity && !trimmedQuery && (
          <p className="mt-3 text-[13px] text-gray-text">
            {t('signature_journeys.showing')} {filteredSignatureJourneys.length}{' '}
            {t('signature_journeys.journeys_in')} {selectedCity.name}
          </p>
        )}
      </section>

      {/* Loading state */}
      {isLoading && (
        <section className="bg-gray-light px-6 py-16 sm:px-10 lg:px-20 lg:py-20">
          <div className="flex items-center justify-center py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-green-dark border-t-transparent"></div>
          </div>
        </section>
      )}

      {/* Empty state — a zero-match search or a filter that excludes everything */}
      {!isLoading && !isSearching && filteredSignatureJourneys.length === 0 && (
        <section
          className="bg-gray-light px-6 py-16 sm:px-10 lg:px-20 lg:py-20"
          data-testid="signature-journeys-empty"
        >
          <div className="py-20 text-center">
            <p className="text-gray-text">
              {trimmedQuery
                ? t('signature_journeys.no_results')
                : selectedCity
                  ? t('signature_journeys.empty_destination')
                  : t('signature_journeys.empty_none')}
            </p>
            {hasActiveFilter && (
              <button
                onClick={handleClear}
                className="mt-4 text-[14px] font-medium text-gold underline hover:no-underline"
              >
                {t('discover.clear_filter')}
              </button>
            )}
          </div>
        </section>
      )}

      {/* Signature Journeys grid — merchandised for a small, premium set.
          Three columns + a centered max-width container keep four items
          feeling intentional rather than a sparse four-column row. */}
      {!isLoading && filteredSignatureJourneys.length > 0 && (
        <section
          className="bg-gray-light px-6 py-16 sm:px-10 lg:px-20 lg:py-20"
          data-testid="section-signature-journeys"
        >
          <div className="mb-12 text-center">
            <span className="text-[11px] font-semibold tracking-[4px] text-gold">
              {t('signature_journeys.section_overline')}
            </span>
            <h2 className="mt-3 font-primary text-[28px] italic text-green-dark md:text-[36px] lg:text-[42px]">
              {t('signature_journeys.section_title')}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-gray-text">
              {t('signature_journeys.section_subtitle')}
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSignatureJourneys.map((journey) => (
              <SignatureJourneyCard
                key={journey.id}
                journey={journey}
                cityName={
                  journey.city_id ? (cityNameById.get(journey.city_id) ?? undefined) : undefined
                }
              />
            ))}
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="bg-green-dark px-6 py-16 sm:px-10 lg:px-[100px] lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[11px] font-semibold tracking-[4px] text-gold">
            {t('signature_journeys.cta_overline')}
          </span>
          <h2 className="mt-3 font-primary text-[28px] italic text-[#FAF5EF] md:text-[36px] lg:text-[42px]">
            {t('signature_journeys.cta_title')}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-relaxed text-white/50">
            {t('signature_journeys.cta_subtitle')}
          </p>
          <Link
            href="/concierge"
            className="mt-8 inline-block rounded-lg bg-white px-8 py-4 text-[13px] font-semibold text-green-dark transition-colors hover:bg-white/90"
          >
            {t('signature_journeys.cta_button')}
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}

export default function SignatureJourneysPage() {
  return (
    <Suspense>
      <SignatureJourneysContent />
    </Suspense>
  );
}
