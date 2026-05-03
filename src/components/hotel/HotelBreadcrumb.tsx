'use client';

import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

interface HotelBreadcrumbProps {
  hotelName: string;
  cityLabel?: string;
}

export default function HotelBreadcrumb({ hotelName, cityLabel }: HotelBreadcrumbProps) {
  const { t } = useLanguage();

  return (
    <nav
      aria-label="Breadcrumb"
      className="border-b border-gray-border bg-gray-light px-10 py-3 text-[11px] uppercase tracking-[2px] text-gray-text"
    >
      <ol className="mx-auto flex max-w-7xl flex-wrap items-center gap-2">
        <li>
          <Link href="/" className="hover:text-green-dark">
            {t('hotel.breadcrumb_home')}
          </Link>
        </li>
        <li aria-hidden="true" className="text-gray-text/60">
          ›
        </li>
        <li>
          <Link href="/dream-hotels" className="hover:text-green-dark">
            {t('hotel.breadcrumb_dream_hotels')}
          </Link>
        </li>
        {cityLabel && (
          <>
            <li aria-hidden="true" className="text-gray-text/60">
              ›
            </li>
            <li className="text-gray-text">{cityLabel}</li>
          </>
        )}
        <li aria-hidden="true" className="text-gray-text/60">
          ›
        </li>
        <li className="font-semibold text-green-dark">{hotelName}</li>
      </ol>
    </nav>
  );
}
