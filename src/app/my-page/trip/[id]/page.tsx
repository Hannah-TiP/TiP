'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import TopBar from '@/components/TopBar';
import SubNav from '@/components/SubNav';
import Footer from '@/components/Footer';
import { collectTripDocuments, getTripWithVersion, type TripWithVersion } from '@/lib/trip-utils';
import { ITEM_COLORS, ITEM_LABELS, formatDateLabel, formatTime } from '@/lib/trip-display';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Planning',
  'waiting-for-proposal': 'Awaiting Proposal',
  'in-progress': 'In Progress',
  'waiting-for-payment': 'Awaiting Payment',
  paid: 'Payment Confirmed',
  'ready-to-travel': 'Ready to Travel',
  'traveling-now': 'Traveling Now',
  'travel-completed': 'Completed',
  canceled: 'Canceled',
};

/** Statuses where the trip can still be canceled (not yet paid). */
const CANCELABLE_STATUSES = new Set([
  'draft',
  'waiting-for-proposal',
  'in-progress',
  'waiting-for-payment',
]);

function getNights(startDate?: string, endDate?: string): number | null {
  if (!startDate || !endDate) return null;
  const diff = new Date(endDate).getTime() - new Date(startDate).getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '\u2014';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function HeroCard({ trip }: { trip: TripWithVersion }) {
  const title = trip.currentVersion?.title?.trim() || 'New Trip';
  const startDate = trip.currentVersion?.start_date || undefined;
  const endDate = trip.currentVersion?.end_date || undefined;
  const nights = getNights(startDate, endDate);
  const adults = trip.currentVersion?.adults ?? 0;
  const kids = trip.currentVersion?.kids ?? 0;
  const summary = trip.currentVersion?.summary || undefined;
  const statusLabel = STATUS_LABELS[trip.trip.status] ?? trip.trip.status;

  return (
    <div className="bg-[#1E3D2F] rounded-2xl overflow-hidden flex">
      <div className="w-[480px] flex-shrink-0 relative">
        <div className="w-full h-full min-h-[240px] bg-gradient-to-br from-[#2a5240] to-[#C4956A] flex items-center justify-center">
          <span className="text-white text-2xl font-bold px-6 text-center">{title}</span>
        </div>
      </div>
      <div className="flex-1 p-10 text-white flex flex-col justify-center">
        <div className="flex items-center gap-3 mb-2">
          <p className="text-sm uppercase tracking-widest text-white/60">Trip Details</p>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/15 text-white">
            {statusLabel}
          </span>
        </div>
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
          {summary && (
            <div>
              <p className="text-white/50">Summary</p>
              <p className="font-semibold">{summary}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Confirmation dialog for canceling a trip. */
function CancelTripDialog({
  onConfirm,
  onClose,
  canceling,
}: {
  onConfirm: () => void;
  onClose: () => void;
  canceling: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-8">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Cancel this trip?</h3>
        <p className="text-sm text-gray-500 mb-6">
          This action cannot be undone. The trip will be marked as canceled and will no longer
          appear in your active trips.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={canceling}
            className="px-5 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-full hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Keep Trip
          </button>
          <button
            onClick={onConfirm}
            disabled={canceling}
            className="px-5 py-2.5 bg-red-600 text-white text-sm font-medium rounded-full hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {canceling ? 'Canceling...' : 'Yes, Cancel Trip'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tripWithVersion, setTripWithVersion] = useState<TripWithVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

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

  const handleCancelTrip = useCallback(async () => {
    if (!id) return;
    setCanceling(true);
    setCancelError(null);
    try {
      const res = await fetch(`/api/trip/${id}/cancel`, { method: 'POST' });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || 'Failed to cancel trip');
      }
      // Redirect back to my-page after successful cancellation
      router.push('/my-page');
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Failed to cancel trip');
      setCanceling(false);
      setShowCancelDialog(false);
    }
  }, [id, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopBar activeLink="My Page" />
        <SubNav activeTab="Upcoming Travels" />
        <div className="max-w-7xl mx-auto px-6 mt-8 space-y-4 animate-pulse">
          <div className="h-56 bg-gray-200 rounded-2xl" />
          <div className="grid grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !tripWithVersion) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopBar activeLink="My Page" />
        <SubNav activeTab="Upcoming Travels" />
        <div className="max-w-7xl mx-auto px-6 mt-8 text-center py-20 text-gray-500">
          <p>{error ?? 'Trip not found.'}</p>
          <Link
            href="/my-page"
            className="mt-4 inline-block text-[#1E3D2F] hover:underline text-sm"
          >
            ← Back to My Trips
          </Link>
        </div>
      </div>
    );
  }

  const { trip, currentVersion } = tripWithVersion;
  const plan = currentVersion?.plan ?? [];
  const documents = collectTripDocuments(currentVersion);
  const allItems = plan.flatMap((day) => day.items);
  const isPending = trip.status === 'draft' || trip.status === 'waiting-for-proposal';
  const canCancel = CANCELABLE_STATUSES.has(trip.status);

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar activeLink="My Page" />
      <SubNav activeTab="Upcoming Travels" />

      {showCancelDialog && (
        <CancelTripDialog
          onConfirm={handleCancelTrip}
          onClose={() => setShowCancelDialog(false)}
          canceling={canceling}
        />
      )}

      <div className="max-w-7xl mx-auto px-6 mt-8 mb-16 space-y-6">
        <Link href="/my-page" className="text-sm text-gray-500 hover:text-gray-900 inline-block">
          ← My Trips
        </Link>

        <HeroCard trip={tripWithVersion} />

        {cancelError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            {cancelError}
          </div>
        )}

        {isPending && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">What happens next?</h3>
                <p className="text-sm text-gray-500">
                  {trip.status === 'draft'
                    ? 'Your trip is still being refined. Continue editing it in Concierge or submit it when you are ready.'
                    : "Your concierge team is working on the next version of this trip. We'll update it as soon as it is ready."}
                </p>
              </div>
              {trip.status === 'draft' && (
                <div className="flex flex-shrink-0 gap-3">
                  <Link
                    href={`/concierge?trip_id=${trip.id}`}
                    className="px-5 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-full hover:bg-gray-50 transition-colors"
                  >
                    Edit in Concierge
                  </Link>
                  <Link
                    href={`/concierge?trip_id=${trip.id}&action=submit`}
                    className="px-6 py-2.5 bg-[#1E3D2F] text-white text-sm font-medium rounded-full hover:bg-[#2a5240] transition-colors"
                  >
                    Submit Trip
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-5">Itinerary</h2>
              {plan.length > 0 ? (
                <div className="space-y-4">
                  {plan.map((day, index) => (
                    <div key={`${day.date}-${index}`} className="flex gap-5 items-start">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-[#1E3D2F] text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
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
                          <span className="text-xs text-gray-400">{formatDateLabel(day.date)}</span>
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
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
                  No itinerary available yet.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {documents.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3">Booking Documents</h2>
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

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Trip Summary</h3>
              <div className="grid grid-cols-2 gap-3">
                {getNights(
                  currentVersion?.start_date || undefined,
                  currentVersion?.end_date || undefined,
                ) !== null && (
                  <div className="text-center bg-gray-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-[#1E3D2F]">
                      {getNights(
                        currentVersion?.start_date || undefined,
                        currentVersion?.end_date || undefined,
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">Nights</p>
                  </div>
                )}
                <div className="text-center bg-gray-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-[#1E3D2F]">{plan.length}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Days</p>
                </div>
                <div className="text-center bg-gray-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-[#1E3D2F]">
                    {allItems.filter((item) => item.item_type === 'activity').length}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Activities</p>
                </div>
                <div className="text-center bg-gray-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-[#1E3D2F]">
                    {(currentVersion?.adults ?? 0) + (currentVersion?.kids ?? 0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Travelers</p>
                </div>
              </div>
            </div>

            {canCancel && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-2">Cancel Trip</h3>
                <p className="text-xs text-gray-500 mb-4">
                  If you no longer need this trip, you can cancel it. This cannot be undone.
                </p>
                <button
                  onClick={() => setShowCancelDialog(true)}
                  className="w-full px-5 py-2.5 border border-red-200 text-red-600 text-sm font-medium rounded-full hover:bg-red-50 transition-colors"
                >
                  Cancel Trip
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
