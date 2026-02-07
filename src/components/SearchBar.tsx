"use client";

import { useState } from "react";
import DatePickerDropdown from "./DatePickerDropdown";
import GuestsDropdown from "./GuestsDropdown";
import DestinationDropdown from "./DestinationDropdown";
import TripTypeDropdown from "./TripTypeDropdown";
import TravelStyleDropdown from "./TravelStyleDropdown";

export default function SearchBar() {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [destination, setDestination] = useState("");
  const [dates, setDates] = useState({ checkIn: "", checkOut: "" });
  const [guests, setGuests] = useState({ adults: 2, children: 0 });
  const [tripType, setTripType] = useState("Leisure");
  const [travelStyle, setTravelStyle] = useState("");

  const toggleDropdown = (name: string) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  return (
    <div className="relative">
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
            {destination || "Where to?"}
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
          onClick={() => {
            console.log("Search:", { destination, dates, guests, tripType, travelStyle });
          }}
        >
          <span className="icon-lucide">&#xe8b6;</span>
          Search
        </button>
      </div>

      {/* Dropdowns */}
      {activeDropdown === "destination" && (
        <DestinationDropdown
          value={destination}
          onChange={(val) => {
            setDestination(val);
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
