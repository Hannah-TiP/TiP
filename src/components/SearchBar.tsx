"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DatePickerDropdown from "./DatePickerDropdown";
import GuestsDropdown from "./GuestsDropdown";
import DestinationDropdown from "./DestinationDropdown";
import TripTypeDropdown from "./TripTypeDropdown";
import TravelStyleDropdown from "./TravelStyleDropdown";

export default function SearchBar() {
  const router = useRouter();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [destination, setDestination] = useState<{ id: number; name: string } | null>(null);
  const [dates, setDates] = useState({ checkIn: "", checkOut: "" });
  const [guests, setGuests] = useState({ adults: 2, children: 0 });
  const [tripType, setTripType] = useState("Leisure");
  const [travelStyle, setTravelStyle] = useState("");

  const toggleDropdown = (name: string) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  const handleSearch = () => {
    // Validate that destination is selected
    if (!destination) {
      alert("Please select a destination");
      return;
    }

    // Build search query parameters
    const params = new URLSearchParams();
    params.set('cityId', destination.id.toString());
    params.set('city', destination.name);

    if (dates.checkIn) params.set('checkIn', dates.checkIn);
    if (dates.checkOut) params.set('checkOut', dates.checkOut);

    params.set('adults', guests.adults.toString());
    params.set('children', guests.children.toString());

    if (tripType) params.set('tripType', tripType);
    if (travelStyle) params.set('travelStyle', travelStyle);

    // Navigate to search results page
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="relative z-[100]">
      <div
        className="flex items-center rounded-lg bg-white/95"
        style={{
          height: 70,
          border: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        {/* Destination */}
        <div
          className="relative flex h-full cursor-pointer flex-col justify-center px-6"
          style={{ minWidth: 180 }}
          onClick={() => toggleDropdown("destination")}
        >
          <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
            DESTINATION
          </span>
          <span className="text-[14px] font-medium text-green-dark">
            {destination?.name || "Where to?"}
          </span>
        </div>

        <div className="h-8 w-px bg-gray-200" />

        {/* Check-in */}
        <div
          className="relative flex h-full cursor-pointer flex-col justify-center px-6"
          style={{ minWidth: 140 }}
          onClick={() => toggleDropdown("dates")}
        >
          <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
            CHECK-IN
          </span>
          <span className="text-[14px] font-medium text-green-dark">
            {dates.checkIn || "Add date"}
          </span>
        </div>

        <div className="h-8 w-px bg-gray-200" />

        {/* Check-out */}
        <div
          className="relative flex h-full cursor-pointer flex-col justify-center px-6"
          style={{ minWidth: 140 }}
          onClick={() => toggleDropdown("dates")}
        >
          <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
            CHECK-OUT
          </span>
          <span className="text-[14px] font-medium text-green-dark">
            {dates.checkOut || "Add date"}
          </span>
        </div>

        <div className="h-8 w-px bg-gray-200" />

        {/* Guests */}
        <div
          className="relative flex h-full cursor-pointer flex-col justify-center px-6"
          style={{ minWidth: 120 }}
          onClick={() => toggleDropdown("guests")}
        >
          <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
            GUESTS
          </span>
          <span className="text-[14px] font-medium text-green-dark">
            {guests.adults + guests.children} Guest{guests.adults + guests.children !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="h-8 w-px bg-gray-200" />

        {/* Trip Type */}
        <div
          className="relative flex h-full cursor-pointer flex-col justify-center px-6"
          style={{ minWidth: 120 }}
          onClick={() => toggleDropdown("tripType")}
        >
          <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
            TRIP TYPE
          </span>
          <span className="text-[14px] font-medium text-green-dark">
            {tripType}
          </span>
        </div>

        <div className="h-8 w-px bg-gray-200" />

        {/* Travel Style */}
        <div
          className="relative flex h-full cursor-pointer flex-col justify-center px-6"
          style={{ minWidth: 140 }}
          onClick={() => toggleDropdown("travelStyle")}
        >
          <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
            TRAVEL STYLE
          </span>
          <span className="text-[14px] font-medium text-green-dark">
            {travelStyle || "Any Style"}
          </span>
        </div>

        {/* Search Button */}
        <button
          className="ml-auto mr-3 flex h-12 items-center gap-2 rounded-lg bg-green-dark px-6 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
          onClick={handleSearch}
        >
          <span className="icon-lucide">&#xe8b6;</span>
          Search
        </button>
      </div>

      {/* Dropdowns */}
      {activeDropdown === "destination" && (
        <DestinationDropdown
          value={destination?.name || ""}
          onChange={(cityData) => {
            setDestination(cityData);
            setActiveDropdown(null);
          }}
          onClose={() => setActiveDropdown(null)}
        />
      )}

      {activeDropdown === "dates" && (
        <DatePickerDropdown
          checkIn={dates.checkIn}
          checkOut={dates.checkOut}
          onChange={(checkIn, checkOut) => setDates({ checkIn, checkOut })}
          onClose={() => setActiveDropdown(null)}
        />
      )}

      {activeDropdown === "guests" && (
        <GuestsDropdown
          adults={guests.adults}
          children={guests.children}
          onChange={(adults, children) => setGuests({ adults, children })}
          onClose={() => setActiveDropdown(null)}
        />
      )}

      {activeDropdown === "tripType" && (
        <TripTypeDropdown
          value={tripType}
          onChange={(val) => {
            setTripType(val);
            setActiveDropdown(null);
          }}
          onClose={() => setActiveDropdown(null)}
        />
      )}

      {activeDropdown === "travelStyle" && (
        <TravelStyleDropdown
          value={travelStyle}
          onChange={(val) => {
            setTravelStyle(val);
            setActiveDropdown(null);
          }}
          onClose={() => setActiveDropdown(null)}
        />
      )}
    </div>
  );
}
