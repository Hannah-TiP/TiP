"use client";

import { useState, useEffect, useRef } from "react";
import { apiClient } from "@/lib/api-client";
import type { City } from "@/types/hotel";

interface DestinationDropdownProps {
  value: string;
  onChange: (cityData: { id: number; name: string }) => void;
  onClose: () => void;
}

export default function DestinationDropdown({
  value,
  onChange,
  onClose,
}: DestinationDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState(value);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch cities from API
  useEffect(() => {
    async function fetchCities() {
      try {
        setLoading(true);
        setError(null);
        const citiesData = await apiClient.getCities('en');
        setCities(citiesData);
      } catch (err) {
        console.error('Failed to fetch cities:', err);
        setError('Failed to load destinations');
      } finally {
        setLoading(false);
      }
    }
    fetchCities();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const filteredDestinations = cities.filter((city) =>
    city.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      ref={ref}
      className="absolute left-0 top-full z-50 mt-2 rounded-xl bg-white shadow-xl"
      style={{ width: 360 }}
    >
      {/* Search input */}
      <div className="border-b border-gray-100 p-4">
        <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-3">
          <span className="icon-lucide text-gray-400">&#xe8b6;</span>
          <input
            type="text"
            placeholder="Search destinations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-[14px] text-green-dark outline-none placeholder:text-gray-400"
            autoFocus
          />
        </div>
      </div>

      {/* Destinations list */}
      <div className="max-h-[320px] overflow-auto p-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-green-dark border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="px-3 py-4 text-center">
            <p className="text-[13px] text-red-500">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-[12px] text-green-dark underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <p className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-gray-400">
              Destinations
            </p>
            {filteredDestinations.map((city) => (
              <button
                key={city.id}
                onClick={() => onChange({ id: city.id, name: city.name })}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-gray-50"
              >
                <span className="icon-lucide text-gray-400">&#xe551;</span>
                <div>
                  <p className="text-[14px] font-medium text-green-dark">{city.name}</p>
                </div>
              </button>
            ))}
            {filteredDestinations.length === 0 && !loading && (
              <p className="px-3 py-4 text-center text-[13px] text-gray-500">
                No destinations found
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
