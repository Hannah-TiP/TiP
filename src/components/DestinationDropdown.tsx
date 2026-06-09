'use client';

import { useState, useEffect, useRef } from 'react';
import { getLocalizedText } from '@/types/common';
import { useLanguage, type TranslationKeys } from '@/contexts/LanguageContext';
import { useDestinationSearch } from '@/hooks/useDestinationSearch';
import type { DestinationSuggestion } from '@/types/destination';

export interface SelectedDestination {
  id: number;
  type: DestinationSuggestion['type'];
  name: string;
}

interface DestinationDropdownProps {
  value: string;
  /**
   * Receives the picked destination with its 3-level `type` so the caller can
   * route country / region / city differently (a country/region id must NOT be
   * treated as a city id).
   */
  onChange: (destination: SelectedDestination) => void;
  onClose: () => void;
  /** When true, render full-width within the mobile planner overlay. */
  mobile?: boolean;
}

function typeLabelKey(type: DestinationSuggestion['type']): TranslationKeys {
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

export default function DestinationDropdown({
  value,
  onChange,
  onClose,
  mobile = false,
}: DestinationDropdownProps) {
  const { t, lang } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState(value);

  // Unified, bookable-only destination search shared with Dream Hotels. A blank
  // query returns the top bookable destinations (the initial state).
  const { suggestions, isLoading, isPopular } = useDestinationSearch(searchQuery, {
    language: lang,
    limit: 10,
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className={`absolute left-0 top-full z-50 mt-2 rounded-xl bg-white shadow-xl ${
        mobile ? 'right-0 w-full max-w-full' : ''
      }`}
      style={mobile ? undefined : { width: 360 }}
    >
      {/* Search input */}
      <div className="border-b border-gray-100 p-4">
        <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-3">
          <span className="icon-lucide text-gray-400">&#xe8b6;</span>
          <input
            type="text"
            placeholder={t('destination.search_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-[14px] text-green-dark outline-none placeholder:text-gray-400"
            autoFocus
          />
        </div>
      </div>

      {/* Destinations list */}
      <div className="max-h-[320px] overflow-auto p-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-green-dark border-t-transparent"></div>
          </div>
        ) : (
          <>
            <p className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-gray-400">
              {isPopular ? t('destination.popular_title') : t('destination.title')}
            </p>
            {suggestions.map((dest) => (
              <button
                key={`${dest.type}-${dest.id}`}
                onClick={() =>
                  onChange({
                    id: dest.id,
                    type: dest.type,
                    name: getLocalizedText(dest.name, lang),
                  })
                }
                className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <span className="icon-lucide text-gray-400">&#xe551;</span>
                  <div>
                    <p className="text-[14px] font-medium text-green-dark">
                      {getLocalizedText(dest.name, lang)}
                    </p>
                    {dest.country_name && (
                      <p className="text-[12px] text-gray-text">
                        {getLocalizedText(dest.country_name, lang)}
                        {dest.region_name ? ` · ${getLocalizedText(dest.region_name, lang)}` : ''}
                      </p>
                    )}
                  </div>
                </div>
                <span className="flex-shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-text">
                  {t(typeLabelKey(dest.type))}
                </span>
              </button>
            ))}
            {suggestions.length === 0 && (
              <p className="px-3 py-4 text-center text-[13px] text-gray-500">
                {t('destination.no_results')}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
