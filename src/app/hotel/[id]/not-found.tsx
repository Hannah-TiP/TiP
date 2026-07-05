'use client';

import Link from 'next/link';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Branded 404 for the hotel detail route. Rendered by `notFound()` in the
 * server shell when the by-slug fetch returns no hotel — replacing the old
 * in-page-error-over-200 rendering with a real HTTP 404.
 */
export default function HotelNotFound() {
  const { t } = useLanguage();

  return (
    <main className="min-h-screen bg-background">
      <div className="flex flex-col items-center justify-center py-40">
        <h1 className="font-primary text-[42px] italic text-green-dark">
          {t('hotel.not_found_title')}
        </h1>
        <p className="mt-4 text-gray-text">{t('hotel.not_found_message')}</p>
        <Link
          href="/dream-hotels"
          className="mt-8 rounded-full bg-green-dark px-8 py-3 text-[13px] font-semibold text-white hover:bg-green-dark/90"
        >
          {t('hotel.back_to_hotels')}
        </Link>
      </div>
      <Footer />
    </main>
  );
}
