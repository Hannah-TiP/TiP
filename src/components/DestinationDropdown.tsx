"use client";

import { useState, useEffect, useRef } from "react";

interface DestinationDropdownProps {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
}

const popularDestinations = [
  { city: "Paris", country: "France", icon: "🗼" },
  { city: "Tokyo", country: "Japan", icon: "🗾" },
  { city: "New York", country: "United States", icon: "🗽" },
  { city: "London", country: "United Kingdom", icon: "🇬🇧" },
  { city: "Dubai", country: "UAE", icon: "🏜️" },
  { city: "Singapore", country: "Singapore", icon: "🦁" },
  { city: "Hong Kong", country: "China", icon: "🏙️" },
  { city: "Sydney", country: "Australia", icon: "🦘" },
];

export default function DestinationDropdown({
  value,
  onChange,
  onClose,
}: DestinationDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState(value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const filteredDestinations = popularDestinations.filter(
    (dest) =>
      dest.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dest.country.toLowerCase().includes(searchQuery.toLowerCase())
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

      {/* Popular destinations */}
      <div className="max-h-[320px] overflow-auto p-2">
        <p className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-gray-400">
          Popular Destinations
        </p>
        {filteredDestinations.map((dest) => (
          <button
            key={dest.city}
            onClick={() => onChange(`${dest.city}, ${dest.country}`)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-gray-50"
          >
            <span className="text-xl">{dest.icon}</span>
            <div>
              <p className="text-[14px] font-medium text-green-dark">{dest.city}</p>
              <p className="text-[12px] text-gray-500">{dest.country}</p>
            </div>
          </button>
        ))}
        {filteredDestinations.length === 0 && (
          <p className="px-3 py-4 text-center text-[13px] text-gray-500">
            No destinations found
          </p>
        )}
      </div>
    </div>
  );
}
