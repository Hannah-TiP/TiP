'use client';

import { useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface GuestsDropdownProps {
  adults: number;
  kids: number;
  onChange: (adults: number, kids: number) => void;
  onClose: () => void;
}

export default function GuestsDropdown({ adults, kids, onChange, onClose }: GuestsDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute left-[360px] top-full z-50 mt-2 rounded-xl bg-white p-6 shadow-xl"
      style={{ width: 320 }}
    >
      <h3 className="mb-4 text-[15px] font-semibold text-green-dark">{t('guests.title')}</h3>

      {/* Adults */}
      <div className="flex items-center justify-between border-b border-gray-100 py-4">
        <div>
          <p className="text-[14px] font-medium text-green-dark">{t('guests.adults')}</p>
          <p className="text-[12px] text-gray-500">{t('guests.adults_age')}</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => onChange(Math.max(1, adults - 1), kids)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:border-green-dark hover:text-green-dark disabled:cursor-not-allowed disabled:opacity-50"
            disabled={adults <= 1}
          >
            −
          </button>
          <span className="w-6 text-center text-[15px] font-semibold text-green-dark">
            {adults}
          </span>
          <button
            onClick={() => onChange(Math.min(10, adults + 1), kids)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:border-green-dark hover:text-green-dark disabled:cursor-not-allowed disabled:opacity-50"
            disabled={adults >= 10}
          >
            +
          </button>
        </div>
      </div>

      {/* Children */}
      <div className="flex items-center justify-between py-4">
        <div>
          <p className="text-[14px] font-medium text-green-dark">{t('guests.children')}</p>
          <p className="text-[12px] text-gray-500">{t('guests.children_age')}</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => onChange(adults, Math.max(0, kids - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:border-green-dark hover:text-green-dark disabled:cursor-not-allowed disabled:opacity-50"
            disabled={kids <= 0}
          >
            −
          </button>
          <span className="w-6 text-center text-[15px] font-semibold text-green-dark">{kids}</span>
          <button
            onClick={() => onChange(adults, Math.min(6, kids + 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:border-green-dark hover:text-green-dark disabled:cursor-not-allowed disabled:opacity-50"
            disabled={kids >= 6}
          >
            +
          </button>
        </div>
      </div>

      {/* Done button */}
      <button
        onClick={onClose}
        className="mt-4 w-full rounded-lg bg-green-dark py-3 text-[13px] font-semibold text-white hover:opacity-90"
      >
        {t('guests.done')}
      </button>
    </div>
  );
}
