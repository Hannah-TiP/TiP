'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import TopBar from '@/components/TopBar';
import SubNav from '@/components/SubNav';
import Footer from '@/components/Footer';
import { getTripsWithVersions, type TripWithVersion } from '@/lib/trip-utils';

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
  const [trips, setTrips] = useState<TripWithVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const loaded = await getTripsWithVersions();
        const completed = loaded.filter(({ trip }) => trip.status === 'travel-completed');
        setTrips(completed);
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
      <TopBar activeLink="My Page" />
      <SubNav activeTab="Travel History" />

      <section className="max-w-7xl mx-auto px-6 mt-8 mb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Past Journeys</h1>
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
                className="bg-white rounded-xl border border-gray-200 overflow-hidden flex h-44 animate-pulse"
              >
                <div className="w-64 flex-shrink-0 bg-gray-200" />
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
            <p className="text-gray-500 text-lg mb-4">No completed trips yet.</p>
            <Link
              href="/concierge"
              className="inline-block px-6 py-3 bg-[#1E3D2F] text-white rounded-full text-sm font-medium hover:bg-[#2a5240] transition-colors"
            >
              Plan Your First Trip
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

              return (
                <div
                  key={item.trip.id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden flex"
                >
                  <div className="w-64 flex-shrink-0 bg-gray-100 relative">
                    <div className="w-full h-full min-h-[176px] bg-gradient-to-br from-[#1E3D2F] to-[#C4956A] rounded-l-xl flex items-center justify-center">
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
                          Completed
                        </span>
                      </div>
                      <div className="flex gap-6 mt-3 text-sm text-gray-500">
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

                    <div className="flex items-center justify-end mt-4">
                      <Link
                        href={`/my-page/travel-history/${item.trip.id}`}
                        className="text-sm font-medium text-[#1E3D2F] hover:underline"
                      >
                        View Details →
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
