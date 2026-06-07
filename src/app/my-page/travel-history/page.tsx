'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Footer from '@/components/Footer';
import { apiClient } from '@/lib/api-client';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  getTripReviewableItems,
  getTripsWithVersions,
  toReviewableEntities,
  type TripWithVersion,
} from '@/lib/trip-utils';

interface TripReviewStatus {
  reviewed: number;
  total: number;
}

function getNights(startDate?: string, endDate?: string): number | null {
  if (!startDate || !endDate) return null;
  const diff = new Date(endDate).getTime() - new Date(startDate).getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

function formatDateRange(startDate?: string, endDate?: string): string {
  if (!startDate && !endDate) return '—';
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  if (startDate && endDate) return `${fmt(startDate)} – ${fmt(endDate)}`;
  return fmt((startDate ?? endDate)!);
}

export default function TravelHistory() {
  const { t } = useLanguage();
  const [trips, setTrips] = useState<TripWithVersion[]>([]);
  const [reviewStatus, setReviewStatus] = useState<Record<number, TripReviewStatus>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const loaded = await getTripsWithVersions();
        const completed = loaded.filter(({ trip }) => trip.status === 'travel-completed');
        setTrips(completed);

        // Best-effort per-trip review status badges. A single profile lookup,
        // then one by-entity fetch per reviewable item (the by-entity endpoint
        // is the only way to derive "did I review this" — there is no
        // list-my-reviews endpoint).
        try {
          const user = await apiClient.getProfile();
          const statuses = await Promise.all(
            completed.map(async ({ trip, currentVersion }) => {
              const entities = toReviewableEntities(getTripReviewableItems(currentVersion));
              if (entities.length === 0) return null;
              const lists = await Promise.all(
                entities.map((e) =>
                  apiClient.getReviewsByEntity(e.entityType, e.entityId).catch(() => null),
                ),
              );
              const reviewed = lists.filter((list) =>
                list?.reviews.some((r) => r.author.id === user.id && r.review.deleted_at == null),
              ).length;
              return { tripId: trip.id, status: { reviewed, total: entities.length } };
            }),
          );
          const map: Record<number, TripReviewStatus> = {};
          for (const entry of statuses) {
            if (entry) map[entry.tripId] = entry.status;
          }
          setReviewStatus(map);
        } catch {
          // Leave badges absent on failure.
        }
      } catch {
        setError('Failed to load travel history.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="max-w-7xl mx-auto px-4 md:px-6 mt-8 mb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('travel_history.title')}</h1>
            {!loading && !error && (
              <p className="text-gray-500 mt-1">
                {trips.length} {trips.length === 1 ? 'trip' : 'trips'} completed
              </p>
            )}
          </div>
        </div>

        {loading && (
          <div className="space-y-5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col sm:flex-row sm:h-44 animate-pulse"
              >
                <div className="h-32 w-full sm:h-auto sm:w-64 sm:flex-shrink-0 bg-gray-200" />
                <div className="flex-1 p-6 space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-1/3" />
                  <div className="h-4 bg-gray-100 rounded w-1/4" />
                  <div className="h-4 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && <div className="text-center py-20 text-gray-500">{error}</div>}

        {!loading && !error && trips.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg mb-4">{t('travel_history.empty')}</p>
            <Link
              href="/concierge"
              className="inline-block px-6 py-3 bg-[#1E3D2F] text-white rounded-full text-sm font-medium hover:bg-[#2a5240] transition-colors"
            >
              {t('travel_history.plan_first')}
            </Link>
          </div>
        )}

        {!loading && !error && trips.length > 0 && (
          <div className="space-y-5">
            {trips.map((item) => {
              const title = item.currentVersion?.title?.trim() || 'New Trip';
              const startDate = item.currentVersion?.start_date || undefined;
              const endDate = item.currentVersion?.end_date || undefined;
              const nights = getNights(startDate, endDate);
              const adults = item.currentVersion?.adults ?? 0;
              const kids = item.currentVersion?.kids ?? 0;
              const status = reviewStatus[item.trip.id];

              return (
                <div
                  key={item.trip.id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col sm:flex-row"
                >
                  <div className="h-40 w-full sm:h-auto sm:w-64 sm:flex-shrink-0 bg-gray-100 relative">
                    <div className="w-full h-full min-h-[160px] sm:min-h-[176px] bg-gradient-to-br from-[#1E3D2F] to-[#C4956A] rounded-t-xl sm:rounded-l-xl sm:rounded-tr-none flex items-center justify-center">
                      <span className="text-white text-lg font-semibold px-4 text-center">
                        {title}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                        <span className="text-xs font-semibold text-green-700 bg-green-100 px-3 py-1 rounded-full">
                          {t('travel_history.completed')}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-sm text-gray-500">
                        <span>{formatDateRange(startDate, endDate)}</span>
                        {nights !== null && (
                          <span>
                            {nights} {nights === 1 ? 'Night' : 'Nights'}
                          </span>
                        )}
                        <span>
                          {adults} {adults === 1 ? 'Adult' : 'Adults'}
                          {kids ? `, ${kids} ${kids === 1 ? 'Kid' : 'Kids'}` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      {status ? (
                        <span
                          className={`text-xs font-semibold px-3 py-1 rounded-full ${
                            status.reviewed === status.total
                              ? 'text-green-700 bg-green-100'
                              : 'text-amber-700 bg-amber-100'
                          }`}
                        >
                          {status.reviewed === status.total
                            ? 'All reviewed'
                            : `${status.reviewed}/${status.total} reviewed`}
                        </span>
                      ) : (
                        <span />
                      )}
                      <Link
                        href={`/my-page/travel-history/${item.trip.id}`}
                        className="text-sm font-medium text-[#1E3D2F] hover:underline"
                      >
                        {t('travel_history.view_details')}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
