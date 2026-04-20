'use client';

import { useState } from 'react';
import DatePickerDropdown from '@/components/DatePickerDropdown';
import type { AIChatDateRangePickerWidget, AIChatWidgetResponse } from '@/types/ai-chat';

interface Props {
  widget: AIChatDateRangePickerWidget;
  onSubmit: (response: AIChatWidgetResponse) => void;
  disabled?: boolean;
}

function formatLabel(date: string | null): string {
  if (!date) return '';
  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d) return date;
  const local = new Date(y, m - 1, d);
  return local.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function DateRangePicker({ widget, onSubmit, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleConfirm() {
    if (!checkIn || !checkOut) return;
    setSubmitted(true);
    onSubmit({
      widget_id: widget.widget_id,
      widget_type: 'date_range_picker',
      value: { start_date: checkIn, end_date: checkOut },
    });
  }

  return (
    <div className="mt-3 border border-gray-200 rounded-lg p-3 bg-white">
      <p className="font-inter text-xs text-gray-500 mb-2">Select dates</p>

      <div className="relative inline-block">
        <button
          type="button"
          onClick={() => !disabled && !submitted && setOpen((v) => !v)}
          disabled={disabled || submitted}
          className="px-4 py-2 text-sm border border-gray-300 rounded-full hover:bg-gray-50 disabled:opacity-60"
          data-testid="date-range-trigger"
        >
          {checkIn && checkOut
            ? `${formatLabel(checkIn)} – ${formatLabel(checkOut)}`
            : 'Choose dates'}
        </button>
        {open && (
          <div className="absolute z-50 mt-2">
            <DatePickerDropdown
              checkIn={checkIn}
              checkOut={checkOut}
              onChange={(start, end) => {
                setCheckIn(start);
                setCheckOut(end);
                if (start && end) setOpen(false);
              }}
              onClose={() => setOpen(false)}
            />
          </div>
        )}
      </div>

      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={disabled || submitted || !checkIn || !checkOut}
          className="px-4 py-2 bg-[#1E3D2F] text-white text-sm rounded-full hover:bg-[#2a5240] disabled:opacity-50"
          data-testid="date-range-submit"
        >
          {submitted ? 'Sent' : 'Confirm dates'}
        </button>
      </div>
    </div>
  );
}
