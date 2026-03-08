'use client';

import { useState } from 'react';
import type { UIBlock, WidgetResponsePayload } from '@/types/ai-chat';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  block: UIBlock;
  onSubmit: (payload: WidgetResponsePayload) => void;
  disabled?: boolean;
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

export default function DateRangePicker({ block, onSubmit, disabled }: Props) {
  const { t } = useLanguage();
  const config = block.config as {
    min_date?: string;
    suggested_start?: string;
    suggested_end?: string;
  };

  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = config.min_date ? new Date(config.min_date + 'T00:00:00') : new Date();
    return d.getMonth();
  });
  const [currentYear, setCurrentYear] = useState(() => {
    const d = config.min_date ? new Date(config.min_date + 'T00:00:00') : new Date();
    return d.getFullYear();
  });
  const [selectingCheckIn, setSelectingCheckIn] = useState(true);
  const [checkIn, setCheckIn] = useState(config.suggested_start || '');
  const [checkOut, setCheckOut] = useState(config.suggested_end || '');
  const [submitted, setSubmitted] = useState(false);

  const minDate = config.min_date || new Date().toISOString().split('T')[0];

  const formatDate = (day: number, month: number, year: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const formatDisplay = (dateStr: string) => {
    if (!dateStr) return t('widget.date_select');
    const [y, m, d] = dateStr.split('-');
    return `${months[parseInt(m) - 1].slice(0, 3)} ${parseInt(d)}, ${y}`;
  };

  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDay = (month: number, year: number) => new Date(year, month, 1).getDay();

  const handleDayClick = (day: number, month: number, year: number) => {
    if (disabled || submitted) return;
    const date = formatDate(day, month, year);
    if (date < minDate) return;
    if (selectingCheckIn) {
      setCheckIn(date);
      setCheckOut('');
      setSelectingCheckIn(false);
    } else {
      if (date > checkIn) {
        setCheckOut(date);
      } else {
        setCheckIn(date);
        setCheckOut('');
      }
    }
  };

  const handleDone = () => {
    if (!checkIn || !checkOut || submitted) return;
    setSubmitted(true);
    onSubmit({
      widget_id: block.id,
      widget_type: 'date_range_picker',
      value: { start_date: checkIn, end_date: checkOut },
    });
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else setCurrentMonth(currentMonth - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else setCurrentMonth(currentMonth + 1);
  };

  const nextMonthNum = currentMonth === 11 ? 0 : currentMonth + 1;
  const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;

  const renderCalendar = (month: number, year: number) => {
    const daysCount = getDaysInMonth(month, year);
    const firstDay = getFirstDay(month, year);
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(<div key={`e-${i}`} className="h-8 w-8" />);
    for (let day = 1; day <= daysCount; day++) {
      const date = formatDate(day, month, year);
      const selected = date === checkIn || date === checkOut;
      const inRange = checkIn && checkOut && date > checkIn && date < checkOut;
      const past = date < minDate;
      days.push(
        <button
          key={day}
          onClick={() => !past && handleDayClick(day, month, year)}
          disabled={past || submitted}
          className={`flex h-8 w-8 items-center justify-center rounded-full text-xs transition-colors
            ${selected ? 'bg-[#1E3D2F] text-white' : ''}
            ${inRange ? 'bg-[#1E3D2F]/10' : ''}
            ${past ? 'cursor-not-allowed text-gray-300' : 'hover:bg-gray-100'}
          `}
        >
          {day}
        </button>,
      );
    }
    return days;
  };

  return (
    <div className="mt-3 rounded-xl bg-white border border-gray-100 p-4 shadow-sm max-w-[580px]">
      {/* Selected dates display */}
      <div className="mb-4 flex items-center gap-3">
        <div
          className={`flex-1 rounded-lg border p-2.5 cursor-pointer ${selectingCheckIn && !submitted ? 'border-[#1E3D2F]' : 'border-gray-200'}`}
          onClick={() => !submitted && setSelectingCheckIn(true)}
        >
          <p className="text-[9px] font-medium uppercase tracking-wider text-gray-400">
            {t('widget.date_checkin')}
          </p>
          <p className="text-[13px] font-medium text-[#1E3D2F]">{formatDisplay(checkIn)}</p>
        </div>
        <span className="text-gray-300">→</span>
        <div
          className={`flex-1 rounded-lg border p-2.5 cursor-pointer ${!selectingCheckIn && !submitted ? 'border-[#1E3D2F]' : 'border-gray-200'}`}
          onClick={() => !submitted && setSelectingCheckIn(false)}
        >
          <p className="text-[9px] font-medium uppercase tracking-wider text-gray-400">
            {t('widget.date_checkout')}
          </p>
          <p className="text-[13px] font-medium text-[#1E3D2F]">{formatDisplay(checkOut)}</p>
        </div>
      </div>

      {!submitted && (
        <>
          {/* Calendars */}
          <div className="flex gap-6">
            <div className="flex-1">
              <div className="mb-3 flex items-center justify-between">
                <button
                  onClick={prevMonth}
                  className="rounded-full p-1 text-sm font-bold text-[#1E3D2F] hover:bg-gray-100"
                >
                  ←
                </button>
                <span className="text-[13px] font-semibold text-[#1E3D2F]">
                  {months[currentMonth]} {currentYear}
                </span>
                <div className="w-5" />
              </div>
              <div className="mb-1 grid grid-cols-7 gap-0.5">
                {daysOfWeek.map((d) => (
                  <div
                    key={d}
                    className="flex h-8 w-8 items-center justify-center text-[10px] font-medium text-gray-400"
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {renderCalendar(currentMonth, currentYear)}
              </div>
            </div>
            <div className="flex-1">
              <div className="mb-3 flex items-center justify-between">
                <div className="w-5" />
                <span className="text-[13px] font-semibold text-[#1E3D2F]">
                  {months[nextMonthNum]} {nextMonthYear}
                </span>
                <button
                  onClick={nextMonth}
                  className="rounded-full p-1 text-sm font-bold text-[#1E3D2F] hover:bg-gray-100"
                >
                  →
                </button>
              </div>
              <div className="mb-1 grid grid-cols-7 gap-0.5">
                {daysOfWeek.map((d) => (
                  <div
                    key={d}
                    className="flex h-8 w-8 items-center justify-center text-[10px] font-medium text-gray-400"
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {renderCalendar(nextMonthNum, nextMonthYear)}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
            <button
              onClick={() => {
                setCheckIn('');
                setCheckOut('');
                setSelectingCheckIn(true);
              }}
              className="text-[12px] font-medium text-gray-500 hover:text-gray-700"
            >
              {t('widget.date_clear')}
            </button>
            <button
              onClick={handleDone}
              disabled={!checkIn || !checkOut}
              className="rounded-lg bg-[#1E3D2F] px-5 py-1.5 text-[12px] font-semibold text-white hover:opacity-90 disabled:opacity-40"
            >
              {t('widget.date_done')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
