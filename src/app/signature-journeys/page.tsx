'use client';

import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Footer from '@/components/Footer';
import SignatureJourneyCard from '@/components/signature-journey/SignatureJourneyCard';
import { apiClient } from '@/lib/api-client';
import { getLocalizedText } from '@/types/common';
import { useLanguage } from '@/contexts/LanguageContext';
import type { SignatureJourney } from '@/types/signatureJourney';
import type { City } from '@/types/location';

function SignatureJourneysContent() {
  const [signatureJourneys, setSignatureJourneys] = useState<SignatureJourney[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t, lang } = useLanguage();

  // Filter state
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  // Dropdown state
  const [openDropdown, setOpenDropdown] = useState<'destination' | null>(null);
  const [citySearch, setCitySearch] = useState('');
  const [cities, setCities] = useState<City[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Load cities when dropdown opens
  useEffect(() => {
    if (openDropdown === 'destination' && cities.length === 0) {
      setCitiesLoading(true);
      apiClient
        .getCities(lang)
        .then(setCities)
        .catch(() => {})
        .finally(() => setCitiesLoading(false));
    }
  }, [openDropdown, cities.length, lang]);

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

  const filteredSignatureJourneys = useMemo(() => {
    if (!selectedCity) return signatureJourneys;
    return signatureJourneys.filter((journey) => journey.city_id === selectedCity.id);
  }, [signatureJourneys, selectedCity]);

  const filteredCities = cities.filter((c) =>
    getLocalizedText(c.name).toLowerCase().includes(citySearch.toLowerCase()),
  );

  const cityNameById = useMemo(() => {
    return new Map(cities.map((city) => [city.id, getLocalizedText(city.name)]));
  }, [cities]);

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

      {/* Destination filter */}
      <section className="bg-white px-6 py-10 sm:px-10 lg:px-20" ref={dropdownRef}>
        <div className="flex items-center gap-4">
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
                {t('discover.destination_label')}
              </p>
              <p className="text-[14px] font-medium text-green-dark">
                {selectedCity
                  ? getLocalizedText(selectedCity.name)
                  : t('discover.all_destinations')}
              </p>
            </button>
            {openDropdown === 'destination' && (
              <div className="absolute left-0 top-full z-50 mt-2 w-full rounded-xl bg-white shadow-xl">
                <div className="border-b border-gray-100 p-4">
                  <input
                    type="text"
                    placeholder={t('discover.search_destinations')}
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
                        {t('discover.all_destinations')}
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
                          {t('discover.no_destinations')}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {selectedCity ? (
            <button
              onClick={() => {
                setSelectedCity(null);
                setOpenDropdown(null);
              }}
              className="rounded-lg border border-green-dark px-8 py-4 text-[13px] font-semibold text-green-dark transition-colors hover:bg-green-dark hover:text-white"
            >
              {t('discover.clear')}
            </button>
          ) : (
            <button className="rounded-lg bg-green-dark px-8 py-4 text-[13px] font-semibold text-white">
              {t('discover.search')}
            </button>
          )}
        </div>

        {selectedCity && (
          <p className="mt-3 text-[13px] text-gray-text">
            {t('signature_journeys.showing')} {filteredSignatureJourneys.length}{' '}
            {t('signature_journeys.journeys_in')} {getLocalizedText(selectedCity.name)}
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

      {/* Empty state — shown when the filter excludes everything */}
      {!isLoading && filteredSignatureJourneys.length === 0 && (
        <section
          className="bg-gray-light px-6 py-16 sm:px-10 lg:px-20 lg:py-20"
          data-testid="signature-journeys-empty"
        >
          <div className="py-20 text-center">
            <p className="text-gray-text">
              {selectedCity
                ? t('signature_journeys.empty_destination')
                : t('signature_journeys.empty_none')}
            </p>
            {selectedCity && (
              <button
                onClick={() => setSelectedCity(null)}
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
