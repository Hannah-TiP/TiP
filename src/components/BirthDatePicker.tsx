'use client';

import { useState, useEffect, useRef } from 'react';

interface BirthDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
}

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Convert YYYY-MM-DD to MM/DD/YYYY for display/typing
function toDisplayFormat(isoDate: string): string {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  return `${month}/${day}/${year}`;
}

// Parse typed input (MM/DD/YYYY) to YYYY-MM-DD, returns "" if invalid
function parseTypedDate(input: string): string {
  const match = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return '';
  const [, m, d, y] = match;
  const month = parseInt(m);
  const day = parseInt(d);
  const year = parseInt(y);
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900) return '';
  // Validate day is valid for the month
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day > daysInMonth) return '';
  // Must not be in the future
  const date = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date > today) return '';
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function BirthDatePicker({ value, onChange }: BirthDatePickerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(toDisplayFormat(value));

  // Initialize calendar view to the selected date, or a reasonable default
  const initialDate = value ? new Date(value + 'T00:00:00') : new Date(2000, 0, 1);
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());

  // Sync calendar view and input text when value changes externally
  useEffect(() => {
    setInputValue(toDisplayFormat(value)); // eslint-disable-line react-hooks/set-state-in-effect
    if (value) {
      const d = new Date(value + 'T00:00:00');
      setViewMonth(d.getMonth());
      setViewYear(d.getFullYear());
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();

  const getFirstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

  const formatDate = (day: number, month: number, year: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const isFuture = (day: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(viewYear, viewMonth, day) > today;
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear()
    );
  };

  const handleDayClick = (day: number) => {
    const date = formatDate(day, viewMonth, viewYear);
    onChange(date);
    setOpen(false);
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    const today = new Date();
    const nextM = viewMonth === 11 ? 0 : viewMonth + 1;
    const nextY = viewMonth === 11 ? viewYear + 1 : viewYear;
    // Don't go beyond current month
    if (new Date(nextY, nextM, 1) > new Date(today.getFullYear(), today.getMonth() + 1, 0)) return;
    setViewMonth(nextM);
    setViewYear(nextY);
  };

  const canGoNext = () => {
    const today = new Date();
    const nextM = viewMonth === 11 ? 0 : viewMonth + 1;
    const nextY = viewMonth === 11 ? viewYear + 1 : viewYear;
    return new Date(nextY, nextM, 1) <= new Date(today.getFullYear(), today.getMonth() + 1, 0);
  };

  const prevYear = () => setViewYear(viewYear - 1);
  const nextYear = () => {
    if (viewYear < new Date().getFullYear()) setViewYear(viewYear + 1);
  };

  const daysInMonth = getDaysInMonth(viewMonth, viewYear);
  const firstDay = getFirstDayOfMonth(viewMonth, viewYear);

  return (
    <div className="relative" ref={ref}>
      {/* Input + calendar toggle */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          placeholder="MM/DD/YYYY"
          onChange={(e) => {
            const val = e.target.value;
            setInputValue(val);
            const parsed = parseTypedDate(val);
            if (parsed) {
              onChange(parsed);
            }
          }}
          onBlur={() => {
            // On blur, if the typed value isn't valid, revert to last good value
            const parsed = parseTypedDate(inputValue);
            if (!parsed && inputValue !== '') {
              setInputValue(toDisplayFormat(value));
            }
          }}
          onFocus={() => setOpen(true)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3D2F]/20 focus:border-[#1E3D2F] bg-white"
        />
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-dark transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </button>
      </div>

      {/* Dropdown Calendar */}
      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-2 rounded-xl bg-white p-5 shadow-xl border border-gray-100"
          style={{ width: 320 }}
        >
          {/* Year navigation */}
          <div className="mb-2 flex items-center justify-center gap-3">
            <button
              onClick={prevYear}
              className="rounded-full p-1 text-[13px] font-bold text-green-dark hover:bg-gray-100"
            >
              ‹‹
            </button>
            <span className="text-[13px] font-semibold text-green-dark min-w-[40px] text-center">
              {viewYear}
            </span>
            <button
              onClick={nextYear}
              disabled={viewYear >= new Date().getFullYear()}
              className={`rounded-full p-1 text-[13px] font-bold ${
                viewYear >= new Date().getFullYear()
                  ? 'opacity-30 cursor-not-allowed text-gray-400'
                  : 'text-green-dark hover:bg-gray-100'
              }`}
            >
              ››
            </button>
          </div>

          {/* Month navigation */}
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={prevMonth}
              className="rounded-full p-2 text-[18px] font-bold text-green-dark hover:bg-gray-100"
            >
              ←
            </button>
            <span className="text-[14px] font-semibold text-green-dark">{months[viewMonth]}</span>
            <button
              onClick={nextMonth}
              disabled={!canGoNext()}
              className={`rounded-full p-2 text-[18px] font-bold ${
                canGoNext()
                  ? 'text-green-dark hover:bg-gray-100'
                  : 'opacity-30 cursor-not-allowed text-gray-400'
              }`}
            >
              →
            </button>
          </div>

          {/* Day headers */}
          <div className="mb-2 grid grid-cols-7 gap-1">
            {daysOfWeek.map((day) => (
              <div
                key={day}
                className="flex h-9 w-9 items-center justify-center text-[11px] font-medium text-gray-400"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="h-9 w-9" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const date = formatDate(day, viewMonth, viewYear);
              const selected = date === value;
              const future = isFuture(day);
              const todayHighlight = isToday(day);

              return (
                <button
                  key={day}
                  onClick={() => !future && handleDayClick(day)}
                  disabled={future}
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-[13px] transition-colors
                    ${selected ? 'bg-green-dark text-white' : ''}
                    ${future ? 'cursor-not-allowed text-gray-300' : 'hover:bg-gray-100'}
                    ${todayHighlight && !selected ? 'ring-1 ring-green-dark' : ''}
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Clear action */}
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
            <button
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
              className="text-[13px] font-medium text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg bg-green-dark px-5 py-1.5 text-[13px] font-semibold text-white hover:opacity-90"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
