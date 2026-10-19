'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { getLocalizedText } from '@/types/common';
import type { CitySuggestion } from '@/types/location';
import { useLanguage } from '@/contexts/LanguageContext';
import { newSessionToken } from '@/lib/session-token';

interface CityAutocompleteProps {
  value: number | undefined;
  onChange: (cityId: number | undefined) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Home-city picker backed by Google Places suggestions (SMA-644).
 *
 * One Places session token spans a typing session: every suggestion call and
 * the final resolve call share it, and it resets after a pick or clear.
 * Google rows (`place_id`) are resolved to our city row on pick; DB-fallback
 * rows (`city_id`) are used directly.
 */
export default function CityAutocomplete({
  value,
  onChange,
  placeholder,
  className = '',
}: CityAutocompleteProps) {
  const { t, lang } = useLanguage();
  const [inputValue, setInputValue] = useState('');
  const [results, setResults] = useState<CitySuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [resolveError, setResolveError] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sessionTokenRef = useRef<string | null>(null);
  const searchSeqRef = useRef(0);
  // Bumped on every pick, keystroke and clear so a late resolve is discarded.
  const pickSeqRef = useRef(0);
  // The city we just picked, so the value→name effect needn't refetch it.
  const pickedRef = useRef<{ id: number; name: string; lang: string } | null>(null);

  // On mount (or value change from parent), load the city name to display
  useEffect(() => {
    if (!value) {
      setInputValue('');
      return;
    }
    if (pickedRef.current?.id === value && pickedRef.current.lang === lang) {
      setInputValue(pickedRef.current.name);
      return;
    }
    apiClient
      .getCityById(value, lang)
      .then((city) => setInputValue(getLocalizedText(city.name, lang)))
      .catch(() => setInputValue(''));
  }, [value, lang]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  const search = useCallback(
    async (q: string, sessionToken: string) => {
      const seq = ++searchSeqRef.current;
      if (q.length < 2) {
        setResults([]);
        setIsOpen(false);
        return;
      }
      setIsSearching(true);
      setIsOpen(true);
      try {
        const { suggestions } = await apiClient.getCitySuggestions(q, sessionToken, lang);
        if (seq !== searchSeqRef.current) return;
        setResults(suggestions);
      } catch {
        if (seq !== searchSeqRef.current) return;
        setResults([]);
      } finally {
        if (seq === searchSeqRef.current) setIsSearching(false);
      }
    },
    [lang],
  );

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setInputValue(q);
    setResolveError(false);
    // Typing supersedes any in-flight resolve.
    pickSeqRef.current++;
    setIsResolving(false);

    // Clear selection when user starts typing
    if (value !== undefined) {
      pickedRef.current = null;
      onChange(undefined);
    }

    // A new typing session starts a new Places session token.
    if (!sessionTokenRef.current) sessionTokenRef.current = newSessionToken();
    const sessionToken = sessionTokenRef.current;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(q, sessionToken), 300);
  }

  function cancelPendingSearch() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = null;
    searchSeqRef.current++;
    setIsSearching(false);
  }

  function finishPick(cityId: number, name: string) {
    cancelPendingSearch();
    pickedRef.current = { id: cityId, name, lang };
    sessionTokenRef.current = null;
    setInputValue(name);
    setIsOpen(false);
    setResults([]);
    onChange(cityId);
  }

  async function handleSelect(suggestion: CitySuggestion) {
    if (isResolving) return;
    setResolveError(false);
    const pickSeq = ++pickSeqRef.current;
    // A search scheduled just before the pick must not reopen the dropdown.
    cancelPendingSearch();

    if (suggestion.city_id !== null) {
      finishPick(suggestion.city_id, suggestion.primary_text);
      return;
    }
    if (!suggestion.place_id) return;

    setIsResolving(true);
    try {
      const city = await apiClient.resolveCity(suggestion.place_id, sessionTokenRef.current, lang);
      if (pickSeq !== pickSeqRef.current) return;
      finishPick(city.id, getLocalizedText(city.name, lang) || suggestion.primary_text);
    } catch {
      if (pickSeq !== pickSeqRef.current) return;
      // Keep the dropdown open so the user can retry or pick another row.
      setResolveError(true);
    } finally {
      if (pickSeq === pickSeqRef.current) setIsResolving(false);
    }
  }

  function handleClear() {
    cancelPendingSearch();
    pickSeqRef.current++;
    setIsResolving(false);
    pickedRef.current = null;
    sessionTokenRef.current = null;
    setInputValue('');
    setResults([]);
    setIsOpen(false);
    setResolveError(false);
    onChange(undefined);
  }

  const baseClass =
    'w-full rounded-lg border border-gray-border bg-white px-3 py-2.5 text-sm ' +
    'focus:border-green-dark focus:outline-none focus:ring-1 focus:ring-green-dark';

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => inputValue.length >= 2 && results.length > 0 && setIsOpen(true)}
          placeholder={placeholder ?? t('city_autocomplete.placeholder')}
          className={`${baseClass} pr-8 ${className}`}
          autoComplete="off"
        />
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label={t('city_autocomplete.clear')}
          >
            ✕
          </button>
        )}
      </div>

      {isOpen && (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-border bg-white py-1 shadow-lg">
          {isResolving && (
            <li className="px-3 py-2 text-sm text-gray-text" role="status">
              {t('city_autocomplete.resolving')}
            </li>
          )}
          {resolveError && (
            <li className="px-3 py-2 text-sm text-red-600" role="alert">
              {t('city_autocomplete.resolve_error')}
            </li>
          )}
          {isSearching ? (
            <li className="px-3 py-2 text-sm text-gray-text">{t('city_autocomplete.searching')}</li>
          ) : results.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-text">
              {t('city_autocomplete.no_results')}
            </li>
          ) : (
            results.map((s) => (
              <li
                key={s.place_id ?? `city-${s.city_id}`}
                onMouseDown={() => handleSelect(s)}
                className={`px-3 py-2 text-sm hover:bg-gray-light ${
                  isResolving ? 'cursor-wait opacity-60' : 'cursor-pointer'
                }`}
              >
                <span className="font-medium text-gray-900">{s.primary_text}</span>
                {s.secondary_text && (
                  <span className="ml-1.5 text-xs text-gray-text">{s.secondary_text}</span>
                )}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
