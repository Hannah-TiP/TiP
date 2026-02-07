"use client";

import { useEffect, useRef } from "react";

interface TravelStyleDropdownProps {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
}

const travelStyles = [
  { value: "Solo Retreat", icon: "🧘", description: "Peaceful, personal time" },
  { value: "Family Memories", icon: "👨‍👩‍👧‍👦", description: "Kid-friendly adventures" },
  { value: "Romantic Escape", icon: "💕", description: "Intimate experiences" },
  { value: "Adventure Seeker", icon: "🏔️", description: "Thrill and excitement" },
  { value: "Cultural Explorer", icon: "🏛️", description: "Heritage and history" },
  { value: "Wellness Focus", icon: "🌿", description: "Health and rejuvenation" },
];

export default function TravelStyleDropdown({
  value,
  onChange,
  onClose,
}: TravelStyleDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full z-50 mt-2 rounded-xl bg-white p-3 shadow-xl"
      style={{ width: 320 }}
    >
      <p className="mb-2 px-2 text-[11px] font-medium uppercase tracking-wider text-gray-400">
        Travel Style
      </p>
      <div className="grid grid-cols-2 gap-2">
        {travelStyles.map((style) => (
          <button
            key={style.value}
            onClick={() => onChange(style.value)}
            className={`flex flex-col items-center rounded-lg p-4 text-center transition-colors hover:bg-gray-50 ${
              value === style.value ? "bg-green-dark/5 ring-1 ring-green-dark" : "bg-gray-50/50"
            }`}
          >
            <span className="mb-2 text-2xl">{style.icon}</span>
            <p className={`text-[13px] font-medium ${value === style.value ? "text-green-dark" : "text-gray-700"}`}>
              {style.value}
            </p>
            <p className="mt-1 text-[10px] text-gray-500">{style.description}</p>
          </button>
        ))}
      </div>
      <button
        onClick={() => onChange("")}
        className="mt-3 w-full text-center text-[12px] text-gray-500 hover:text-gray-700"
      >
        Clear selection
      </button>
    </div>
  );
}
