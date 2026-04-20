'use client';

import type { AIChatWidgetResponse } from '@/types/ai-chat';

interface WidgetResponseDisplayProps {
  response: AIChatWidgetResponse;
}

function formatDateLabel(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const date = new Date(year, month, day);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function WidgetResponseDisplay({ response }: WidgetResponseDisplayProps) {
  switch (response.widget_type) {
    case 'date_range_picker': {
      const start = response.value.start_date ?? null;
      const end = response.value.end_date ?? null;
      const label =
        start && end
          ? `${formatDateLabel(start)} \u2013 ${formatDateLabel(end)}`
          : 'Dates selected';
      return (
        <div className="flex items-center gap-2" data-testid="widget-response-date-range">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 opacity-70"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span className="font-inter text-sm">{label}</span>
        </div>
      );
    }
    case 'number_stepper': {
      const entries = Object.entries(response.value.values);
      if (entries.length === 0) {
        return (
          <span className="font-inter text-sm" data-testid="widget-response-number-stepper">
            Travelers selected
          </span>
        );
      }
      return (
        <div className="flex flex-wrap gap-2" data-testid="widget-response-number-stepper">
          {entries.map(([key, value]) => (
            <span
              key={key}
              className="inline-flex items-center gap-1 bg-white/20 rounded-full px-3 py-1 font-inter text-sm"
            >
              {String(value)} {capitalize(key)}
            </span>
          ))}
        </div>
      );
    }
    case 'option_selector': {
      return (
        <span
          className="inline-flex items-center bg-white/20 rounded-full px-4 py-1 font-inter text-sm"
          data-testid="widget-response-option-selector"
        >
          {response.value.value}
        </span>
      );
    }
    case 'hotel_carousel': {
      const hotelId = response.value.hotel_id;
      return (
        <div className="flex items-center gap-2" data-testid="widget-response-hotel-carousel">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 opacity-70"
          >
            <path d="M3 21h18" />
            <path d="M5 21V7l8-4v18" />
            <path d="M19 21V11l-6-4" />
            <path d="M9 9h1" />
            <path d="M9 13h1" />
            <path d="M9 17h1" />
          </svg>
          <span className="font-inter text-sm">
            {hotelId != null ? `Hotel ${hotelId}` : 'Hotel selected'}
          </span>
        </div>
      );
    }
  }
}
