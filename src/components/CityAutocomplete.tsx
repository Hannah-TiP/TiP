'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { getLocalizedText } from '@/types/common';
import type { City } from '@/types/location';

interface CityAutocompleteProps {
  value: number | undefined;
  onChange: (cityId: number | undefined) => void;
  placeholder?: string;
  className?: string;
}

export default function CityAutocomplete({
  value,
  onChange,
  placeholder = 'Search city...',
  className = '',
}: CityAutocompleteProps) {
  const [inputValue, setInputValue] = useState('');
  const [results, setResults] = useState<City[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // On mount (or value change from parent), load the city name to display
  useEffect(() => {
    if (!value) {
      setInputValue('');
      return;
    }
    apiClient
      .getCityById(value)
      .then((city) => setInputValue(getLocalizedText(city.name)))
      .catch(() => setInputValue(''));
  }, [value]);

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

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    setIsSearching(true);
    try {
      const cities = await apiClient.searchCities(q);
      setResults(cities);
      setIsOpen(true);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setInputValue(q);

    // Clear selection when user starts typing
    if (value !== undefined) {
      onChange(undefined);
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(q), 300);
  }

  function handleSelect(city: City) {
    setInputValue(getLocalizedText(city.name));
    setIsOpen(false);
    setResults([]);
    onChange(city.id);
  }

  function handleClear() {
    setInputValue('');
    setResults([]);
    setIsOpen(false);
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
          placeholder={placeholder}
          className={`${baseClass} pr-8 ${className}`}
          autoComplete="off"
        />
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Clear"
          >
            ✕
          </button>
        )}
      </div>

      {isOpen && (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-border bg-white py-1 shadow-lg">
          {isSearching ? (
            <li className="px-3 py-2 text-sm text-gray-text">Searching...</li>
          ) : results.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-text">No cities found</li>
          ) : (
            results.map((city) => (
              <li
                key={city.id}
                onMouseDown={() => handleSelect(city)}
                className="cursor-pointer px-3 py-2 text-sm hover:bg-gray-light"
              >
                {getLocalizedText(city.name)}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
