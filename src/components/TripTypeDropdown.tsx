"use client";

import { useEffect, useRef } from "react";

interface TripTypeDropdownProps {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
}

const tripTypes = [
  { value: "Leisure", description: "Relaxation and exploration" },
  { value: "Business", description: "Work travel with comfort" },
  { value: "Bleisure", description: "Business + leisure combined" },
];

export default function TripTypeDropdown({
  value,
  onChange,
  onClose,
}: TripTypeDropdownProps) {
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
      className="absolute left-[560px] top-full z-50 mt-2 rounded-xl bg-white p-2 shadow-xl"
      style={{ width: 280 }}
    >
      {tripTypes.map((type) => (
        <button
          key={type.value}
          onClick={() => onChange(type.value)}
          className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
            value === type.value ? "bg-green-dark/5" : ""
          }`}
        >
          <div>
            <p className={`text-[14px] font-medium ${value === type.value ? "text-green-dark" : "text-gray-700"}`}>
              {type.value}
            </p>
            <p className="text-[12px] text-gray-500">{type.description}</p>
          </div>
          {value === type.value && (
            <span className="icon-lucide text-green-dark">&#xe86c;</span>
          )}
        </button>
      ))}
    </div>
  );
}
