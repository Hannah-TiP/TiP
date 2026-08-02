'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Footer from '@/components/Footer';
import { apiClient } from '@/lib/api-client';
import { useLanguage, type Lang } from '@/contexts/LanguageContext';
import { formatDate as formatDateI18n } from '@/lib/format-date';
import { getStatusLabel } from '@/lib/trip-display';
import type { SharedTripItem } from '@/types/trip-share';

function getNights(startDate?: string | null, endDate?: string | null): number | null {
  if (!startDate || !endDate) return null;
  const diff = new Date(endDate).getTime() - new Date(startDate).getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string | null | undefined, lang: Lang): string {
  if (!dateStr) return '—';
  return formatDateI18n(dateStr, lang, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function SharedTripCard({ item }: { item: SharedTripItem }) {
  const { t, lang } = useLanguage();
  const title = item.title?.trim() || t('shared_trips.untitled');
  const nights = getNights(item.start_date, item.end_date);
  const statusLabel = getStatusLabel(item.status, t);

  return (
    <Link href={`/shared-trips/${item.trip_id}`} className="block group">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-[#C4956A]/40 transition-all">
        <div className="h-36 relative">
          <div className="w-full h-full bg-gradient-to-br from-[#2a5240] to-[#C4956A]" />
          <span className="absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full bg-white/90 text-gray-700">
            {statusLabel}
          </span>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-1 truncate">{title}</h3>
          <p className="text-sm text-gray-500">
            {formatDate(item.start_date, lang)} – {formatDate(item.end_date, lang)}
            {nights !== null && <span className="ml-2 text-gray-400">({nights}N)</span>}
          </p>
          {item.created_by_email && (
            <p className="text-xs text-gray-400 mt-1">
              {t('shared_trips.shared_by').replace('{email}', item.created_by_email)}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function SharedTripsPage() {
  const { t, lang } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<SharedTripItem[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        setItems(await apiClient.getSharedTrips(lang));
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [lang]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 mt-8 mb-16">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('shared_trips.title')}</h1>
        <p className="text-sm text-gray-500 mb-6">{t('shared_trips.subtitle')}</p>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-xl" />
            ))}
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="text-center py-24" data-testid="shared-trips-empty">
            <p className="text-5xl mb-6">🤝</p>
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              {t('shared_trips.empty_title')}
            </h2>
            <p className="text-gray-500">{t('shared_trips.empty_subtitle')}</p>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((item) => (
              <SharedTripCard key={item.trip_id} item={item} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
