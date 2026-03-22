'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import TopBar from '@/components/TopBar';
import SubNav from '@/components/SubNav';
import Footer from '@/components/Footer';
import type { TripPlanItem } from '@/types/trip';
import { collectTripDocuments, getTripWithVersion, type TripWithVersion } from '@/lib/trip-utils';

const ITEM_LABELS: Record<TripPlanItem['item_type'], string> = {
  flight: 'Flight',
  hotel: 'Hotel',
  restaurant: 'Restaurant',
  activity: 'Activity',
  transfer: 'Transfer',
  note: 'Note',
};

const ITEM_COLORS: Record<TripPlanItem['item_type'], string> = {
  flight: 'bg-blue-100 text-blue-700',
  hotel: 'bg-purple-100 text-purple-700',
  restaurant: 'bg-amber-100 text-amber-700',
  activity: 'bg-green-100 text-green-700',
  transfer: 'bg-cyan-100 text-cyan-700',
  note: 'bg-gray-100 text-gray-600',
};

function getNights(startDate?: string, endDate?: string): number | null {
  if (!startDate || !endDate) return null;
  const diff = new Date(endDate).getTime() - new Date(startDate).getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDayDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(dateStr?: string | null): string | undefined {
  if (!dateStr) return undefined;
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function TravelHistoryTripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tripWithVersion, setTripWithVersion] = useState<TripWithVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        setTripWithVersion(await getTripWithVersion(Number(id)));
      } catch {
        setError('Failed to load trip details.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopBar activeLink="My Page" />
        <SubNav activeTab="Travel History" />
        <div className="max-w-5xl mx-auto px-6 mt-8 space-y-4 animate-pulse">
          <div className="h-48 bg-gray-200 rounded-2xl" />
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-100 rounded w-1/4" />
        </div>
      </div>
    );
  }

  if (error || !tripWithVersion) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopBar activeLink="My Page" />
        <SubNav activeTab="Travel History" />
        <div className="max-w-5xl mx-auto px-6 mt-8 text-center py-20 text-gray-500">
          <p>{error ?? 'Trip not found.'}</p>
          <Link
            href="/my-page/travel-history"
            className="mt-4 inline-block text-[#1E3D2F] hover:underline text-sm"
          >
            ← Back to Travel History
          </Link>
        </div>
      </div>
    );
  }

  const { currentVersion } = tripWithVersion;
  const title = currentVersion?.title?.trim() || 'New Trip';
  const startDate = currentVersion?.start_date || undefined;
  const endDate = currentVersion?.end_date || undefined;
  const nights = getNights(startDate, endDate);
  const adults = currentVersion?.adults ?? 0;
  const kids = currentVersion?.kids ?? 0;
  const plan = currentVersion?.plan ?? [];
  const documents = collectTripDocuments(currentVersion);
  const activitiesCount = plan
    .flatMap((day) => day.items)
    .filter((item) => item.item_type === 'activity').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar activeLink="My Page" />
      <SubNav activeTab="Travel History" />

      <div className="max-w-5xl mx-auto px-6 mt-8 mb-16">
        <Link
          href="/my-page/travel-history"
          className="text-sm text-gray-500 hover:text-gray-900 mb-6 inline-block"
        >
          ← Travel History
        </Link>

        <div className="bg-[#1E3D2F] rounded-2xl overflow-hidden flex mb-8">
          <div className="w-72 flex-shrink-0 bg-gradient-to-br from-[#2a5240] to-[#C4956A] min-h-[200px] flex items-center justify-center">
            <span className="text-white text-3xl font-bold px-6 text-center">{title}</span>
          </div>
          <div className="flex-1 p-10 text-white flex flex-col justify-center">
            <p className="text-sm uppercase tracking-widest text-white/60 mb-2">Completed Trip</p>
            <h1 className="text-4xl font-bold mb-4">{title}</h1>
            <div className="flex flex-wrap gap-8 text-sm">
              <div>
                <p className="text-white/50">Dates</p>
                <p className="font-semibold">
                  {formatDate(startDate)} – {formatDate(endDate)}
                </p>
              </div>
              {nights !== null && (
                <div>
                  <p className="text-white/50">Duration</p>
                  <p className="font-semibold">
                    {nights} {nights === 1 ? 'Night' : 'Nights'}
                  </p>
                </div>
              )}
              <div>
                <p className="text-white/50">Travelers</p>
                <p className="font-semibold">
                  {adults} {adults === 1 ? 'Adult' : 'Adults'}
                  {kids ? `, ${kids} ${kids === 1 ? 'Kid' : 'Kids'}` : ''}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-5">
            {plan.length > 0 ? (
              <>
                <h2 className="text-xl font-bold text-gray-900">Itinerary</h2>
                {plan.map((day, index) => (
                  <div key={`${day.date}-${index}`} className="flex gap-4 items-start">
                    <div className="flex flex-col items-center">
                      <div className="w-9 h-9 rounded-full bg-[#1E3D2F] text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                        {index + 1}
                      </div>
                      {index < plan.length - 1 && (
                        <div className="w-px flex-1 bg-gray-200 mt-1 min-h-[24px]" />
                      )}
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-5 flex-1 mb-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-xs font-semibold text-[#1E3D2F] bg-green-50 px-2 py-0.5 rounded">
                          Day {index + 1}
                        </span>
                        <span className="text-xs text-gray-400">{formatDayDate(day.date)}</span>
                        {day.title && (
                          <span className="text-xs font-medium text-gray-700">{day.title}</span>
                        )}
                      </div>
                      {day.items.length > 0 ? (
                        <div className="space-y-2">
                          {day.items.map((item, itemIndex) => (
                            <div
                              key={`${day.date}-${itemIndex}`}
                              className="flex items-start gap-3"
                            >
                              <span
                                className={`text-xs px-2 py-0.5 rounded font-medium flex-shrink-0 mt-0.5 ${ITEM_COLORS[item.item_type]}`}
                              >
                                {ITEM_LABELS[item.item_type]}
                              </span>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {item.title || ITEM_LABELS[item.item_type]}
                                </p>
                                {item.location && (
                                  <p className="text-xs text-gray-400">{item.location}</p>
                                )}
                                {item.start_at && (
                                  <p className="text-xs text-gray-400">
                                    {formatTime(item.start_at)}
                                    {item.end_at ? ` – ${formatTime(item.end_at)}` : ''}
                                  </p>
                                )}
                                {item.description && (
                                  <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">No items for this day.</p>
                      )}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
                No itinerary available.
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Trip Summary</h3>
              <div className="grid grid-cols-2 gap-3">
                {nights !== null && (
                  <div className="text-center bg-gray-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-[#1E3D2F]">{nights}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Nights</p>
                  </div>
                )}
                <div className="text-center bg-gray-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-[#1E3D2F]">{plan.length}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Days</p>
                </div>
                <div className="text-center bg-gray-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-[#1E3D2F]">{activitiesCount}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Activities</p>
                </div>
                <div className="text-center bg-gray-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-[#1E3D2F]">{adults + kids}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Travelers</p>
                </div>
              </div>
            </div>

            {documents.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-3">Booking Documents</h3>
                <div className="space-y-2">
                  {documents.map((document, index) => (
                    <a
                      key={`${document.file}-${index}`}
                      href={document.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-[#1E3D2F] hover:underline"
                    >
                      <span>📄</span>
                      <span className="truncate">
                        {document.file_name || document.document_type || `Document ${index + 1}`}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
