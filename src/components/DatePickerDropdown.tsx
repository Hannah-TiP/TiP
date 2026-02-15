"use client";

import { useState, useEffect, useRef } from "react";

interface DatePickerDropdownProps {
  checkIn: string;
  checkOut: string;
  onChange: (checkIn: string, checkOut: string) => void;
  onClose: () => void;
}

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function DatePickerDropdown({
  checkIn,
  checkOut,
  onChange,
  onClose,
}: DatePickerDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectingCheckIn, setSelectingCheckIn] = useState(true);
  const [tempCheckIn, setTempCheckIn] = useState(checkIn);
  const [tempCheckOut, setTempCheckOut] = useState(checkOut);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const formatDate = (day: number, month: number, year: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-");
    return `${months[parseInt(month) - 1].slice(0, 3)} ${parseInt(day)}, ${year}`;
  };

  const handleDayClick = (day: number, month: number, year: number) => {
    const date = formatDate(day, month, year);
    if (selectingCheckIn) {
      setTempCheckIn(date);
      setTempCheckOut("");
      setSelectingCheckIn(false);
    } else {
      if (date > tempCheckIn) {
        setTempCheckOut(date);
        onChange(tempCheckIn, date);
      } else {
        setTempCheckIn(date);
        setTempCheckOut("");
      }
    }
  };

  const isInRange = (day: number) => {
    const date = formatDate(day, currentMonth, currentYear);
    return tempCheckIn && tempCheckOut && date > tempCheckIn && date < tempCheckOut;
  };

  const isSelected = (day: number) => {
    const date = formatDate(day, currentMonth, currentYear);
    return date === tempCheckIn || date === tempCheckOut;
  };

  const isToday = (day: number, month: number, year: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const isPast = (day: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(currentYear, currentMonth, day);
    return date < today;
  };

  const canGoPrevMonth = () => {
    const today = new Date();
    const currentMonthDate = new Date(currentYear, currentMonth, 1);
    const thisMonthDate = new Date(today.getFullYear(), today.getMonth(), 1);
    return currentMonthDate > thisMonthDate;
  };

  const prevMonth = () => {
    if (!canGoPrevMonth()) return;
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
  const nextMonthNum = currentMonth === 11 ? 0 : currentMonth + 1;
  const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;
  const daysInNextMonth = getDaysInMonth(nextMonthNum, nextMonthYear);
  const firstDayNextMonth = getFirstDayOfMonth(nextMonthNum, nextMonthYear);

  const renderCalendar = (month: number, year: number, daysCount: number, firstDayOffset: number) => {
    const days = [];
    for (let i = 0; i < firstDayOffset; i++) {
      days.push(<div key={`empty-${i}`} className="h-9 w-9" />);
    }
    for (let day = 1; day <= daysCount; day++) {
      const date = formatDate(day, month, year);
      const selected = date === tempCheckIn || date === tempCheckOut;
      const inRange = tempCheckIn && tempCheckOut && date > tempCheckIn && date < tempCheckOut;
      const dateObj = new Date(year, month, day);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const past = dateObj < today;
      const today_highlight = isToday(day, month, year);

      days.push(
        <button
          key={day}
          onClick={() => !past && handleDayClick(day, month, year)}
          disabled={past}
          className={`flex h-9 w-9 items-center justify-center rounded-full text-[13px] transition-colors
            ${selected ? "bg-green-dark text-white" : ""}
            ${inRange ? "bg-green-dark/10" : ""}
            ${past ? "cursor-not-allowed text-gray-300" : "hover:bg-gray-100"}
            ${today_highlight && !selected ? "ring-1 ring-green-dark" : ""}
          `}
        >
          {day}
        </button>
      );
    }
    return days;
  };

  return (
    <div
      ref={ref}
      className="absolute left-0 top-full z-50 mt-2 rounded-xl bg-white p-6 shadow-xl"
      style={{ width: 700 }}
    >
      {/* Selected dates display */}
      <div className="mb-6 flex items-center gap-4">
        <div
          className={`flex-1 rounded-lg border p-3 ${selectingCheckIn ? "border-green-dark" : "border-gray-200"}`}
          onClick={() => setSelectingCheckIn(true)}
        >
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">CHECK-IN</p>
          <p className="text-[14px] font-medium text-green-dark">
            {tempCheckIn ? formatDisplayDate(tempCheckIn) : "Select date"}
          </p>
        </div>
        <span className="text-gray-300">→</span>
        <div
          className={`flex-1 rounded-lg border p-3 ${!selectingCheckIn ? "border-green-dark" : "border-gray-200"}`}
          onClick={() => setSelectingCheckIn(false)}
        >
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">CHECK-OUT</p>
          <p className="text-[14px] font-medium text-green-dark">
            {tempCheckOut ? formatDisplayDate(tempCheckOut) : "Select date"}
          </p>
        </div>
      </div>

      {/* Calendars */}
      <div className="flex gap-8">
        {/* Current month */}
        <div className="flex-1">
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={prevMonth}
              disabled={!canGoPrevMonth()}
              className={`rounded-full p-2 text-[18px] font-bold ${canGoPrevMonth() ? 'hover:bg-gray-100 text-green-dark' : 'opacity-30 cursor-not-allowed text-gray-400'}`}
            >
              ←
            </button>
            <span className="text-[14px] font-semibold text-green-dark">
              {months[currentMonth]} {currentYear}
            </span>
            <div className="w-6" />
          </div>
          <div className="mb-2 grid grid-cols-7 gap-1">
            {daysOfWeek.map((day) => (
              <div key={day} className="flex h-9 w-9 items-center justify-center text-[11px] font-medium text-gray-400">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {renderCalendar(currentMonth, currentYear, daysInMonth, firstDay)}
          </div>
        </div>

        {/* Next month */}
        <div className="flex-1">
          <div className="mb-4 flex items-center justify-between">
            <div className="w-6" />
            <span className="text-[14px] font-semibold text-green-dark">
              {months[nextMonthNum]} {nextMonthYear}
            </span>
            <button onClick={nextMonth} className="rounded-full p-2 text-[18px] font-bold text-green-dark hover:bg-gray-100">
              →
            </button>
          </div>
          <div className="mb-2 grid grid-cols-7 gap-1">
            {daysOfWeek.map((day) => (
              <div key={day} className="flex h-9 w-9 items-center justify-center text-[11px] font-medium text-gray-400">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {renderCalendar(nextMonthNum, nextMonthYear, daysInNextMonth, firstDayNextMonth)}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
        <button
          onClick={() => {
            setTempCheckIn("");
            setTempCheckOut("");
            setSelectingCheckIn(true);
          }}
          className="text-[13px] font-medium text-gray-500 hover:text-gray-700"
        >
          Clear dates
        </button>
        <button
          onClick={onClose}
          className="rounded-lg bg-green-dark px-6 py-2 text-[13px] font-semibold text-white hover:opacity-90"
        >
          Done
        </button>
      </div>
    </div>
  );
}
