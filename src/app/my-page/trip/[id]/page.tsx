'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Footer from '@/components/Footer';
import {
  collectTripDocuments,
  getTripWithVersion,
  tripDayNumber,
  type TripWithVersion,
} from '@/lib/trip-utils';
import { ITEM_COLORS, ITEM_LABELS, formatDateLabel, formatTime } from '@/lib/trip-display';
import { formatDate } from '@/lib/format-date';
import { apiClient } from '@/lib/api-client';
import { useLanguage } from '@/contexts/LanguageContext';
import ShareTripModal from '@/components/ShareTripModal';
import BookingDocuments from '@/components/BookingDocuments';

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

const DATE_OPTS: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };

function HeroCard({ trip }: { trip: TripWithVersion }) {
  const { t, lang } = useLanguage();
  const title = trip.currentVersion?.title?.trim() || t('trip_detail.new_trip');
  const startDate = trip.currentVersion?.start_date || undefined;
  const endDate = trip.currentVersion?.end_date || undefined;
  const nights = getNights(startDate, endDate);
  const adults = trip.currentVersion?.adults ?? 0;
  const kids = trip.currentVersion?.kids ?? 0;
  const summary = trip.currentVersion?.summary || undefined;
  const statusLabel = STATUS_LABELS[trip.trip.status] ?? trip.trip.status;

  return (
    <div className="bg-[#1E3D2F] rounded-2xl overflow-hidden flex flex-col md:flex-row">
      <div className="w-full md:w-[480px] md:flex-shrink-0 relative">
        <div className="w-full h-full min-h-[240px] bg-gradient-to-br from-[#2a5240] to-[#C4956A] flex items-center justify-center">
          <span className="text-white text-2xl font-bold px-6 text-center">{title}</span>
        </div>
      </div>
      <div className="flex-1 p-6 md:p-10 text-white flex flex-col justify-center">
        <div className="flex items-center gap-3 mb-2">
          <p className="text-sm uppercase tracking-widest text-white/60">
            {t('trip_detail.trip_details')}
          </p>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/15 text-white">
            {statusLabel}
          </span>
        </div>
        <h1 className="text-2xl md:text-4xl font-bold mb-4">{title}</h1>
        <div className="flex flex-wrap gap-8 text-sm">
          <div>
            <p className="text-white/50">{t('trip_detail.dates')}</p>
            <p className="font-semibold">
              {startDate ? formatDate(startDate, lang, DATE_OPTS) : '—'} –{' '}
              {endDate ? formatDate(endDate, lang, DATE_OPTS) : '—'}
            </p>
          </div>
          {nights !== null && (
            <div>
              <p className="text-white/50">{t('trip_detail.duration')}</p>
              <p className="font-semibold">
                {nights} {nights === 1 ? t('common.night') : t('common.nights')}
              </p>
            </div>
          )}
          <div>
            <p className="text-white/50">{t('trip_detail.travelers')}</p>
            <p className="font-semibold">
              {adults} {adults === 1 ? t('common.adult') : t('common.adults')}
              {kids ? `, ${kids} ${kids === 1 ? t('common.kid') : t('common.kids')}` : ''}
            </p>
          </div>
          {summary && (
            <div>
              <p className="text-white/50">{t('trip_detail.summary')}</p>
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
  const { t } = useLanguage();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-8">
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          {t('trip_detail.cancel_confirm_title')}
        </h3>
        <p className="text-sm text-gray-500 mb-6">{t('trip_detail.cancel_confirm_body')}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={canceling}
            className="px-5 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-full hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {t('trip_detail.keep_trip')}
          </button>
          <button
            onClick={onConfirm}
            disabled={canceling}
            className="px-5 py-2.5 bg-red-600 text-white text-sm font-medium rounded-full hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {canceling ? t('trip_detail.canceling') : t('trip_detail.confirm_cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TripDetailPage() {
  const { t, lang } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tripWithVersion, setTripWithVersion] = useState<TripWithVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [latestQuoteId, setLatestQuoteId] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        setTripWithVersion(await getTripWithVersion(Number(id)));
      } catch {
        setError(t('trip_detail.error_load'));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, t]);

  // Best-effort: fetch the trip's latest quote so we can render a "View
  // quote" affordance. Failures are swallowed — the link simply does not
  // appear, which is the no-quote UX anyway.
  useEffect(() => {
    if (!id) return;
    let canceled = false;

    apiClient
      .getLatestQuoteForTrip(Number(id))
      .then((bundle) => {
        if (canceled) return;
        setLatestQuoteId(bundle ? bundle.quote.id : null);
      })
      .catch(() => {
        if (canceled) return;
        setLatestQuoteId(null);
      });

    return () => {
      canceled = true;
    };
  }, [id]);

  const handleCancelTrip = useCallback(async () => {
    if (!id) return;
    setCanceling(true);
    setCancelError(null);
    try {
      const res = await fetch(`/api/trip/${id}/cancel`, { method: 'POST' });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || t('trip_detail.error_cancel'));
      }
      // Redirect back to my-page after successful cancellation
      router.push('/my-page');
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : t('trip_detail.error_cancel'));
      setCanceling(false);
      setShowCancelDialog(false);
    }
  }, [id, router, t]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 mt-8 space-y-4 animate-pulse">
          <div className="h-56 bg-gray-200 rounded-2xl" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
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
        <div className="max-w-7xl mx-auto px-4 md:px-6 mt-8 text-center py-20 text-gray-500">
          <p>{error ?? t('trip_detail.error_not_found')}</p>
          <Link
            href="/my-page"
            className="mt-4 inline-block text-[#1E3D2F] hover:underline text-sm"
          >
            {t('trip_detail.back_to_my_trips')}
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
      {showCancelDialog && (
        <CancelTripDialog
          onConfirm={handleCancelTrip}
          onClose={() => setShowCancelDialog(false)}
          canceling={canceling}
        />
      )}

      <ShareTripModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        tripId={trip.id}
      />

      <div className="max-w-7xl mx-auto px-4 md:px-6 mt-8 mb-16 space-y-6">
        <Link href="/my-page" className="text-sm text-gray-500 hover:text-gray-900 inline-block">
          {t('trip_detail.my_trips')}
        </Link>

        <HeroCard trip={tripWithVersion} />

        {cancelError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            {cancelError}
          </div>
        )}

        {isPending && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {t('trip_detail.what_happens_next')}
                </h3>
                <p className="text-sm text-gray-500">
                  {trip.status === 'draft'
                    ? t('trip_detail.next_draft')
                    : t('trip_detail.next_proposal')}
                </p>
              </div>
              {trip.status === 'draft' && (
                <div className="flex flex-shrink-0 flex-wrap gap-3">
                  <Link
                    href={`/concierge?trip_id=${trip.id}`}
                    className="px-5 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-full hover:bg-gray-50 transition-colors"
                  >
                    {t('trip_detail.edit_in_concierge')}
                  </Link>
                  <Link
                    href={`/concierge?trip_id=${trip.id}&action=submit`}
                    className="px-6 py-2.5 bg-[#1E3D2F] text-white text-sm font-medium rounded-full hover:bg-[#2a5240] transition-colors"
                  >
                    {t('trip_detail.submit_trip')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-5">{t('trip_detail.itinerary')}</h2>
              {plan.length > 0 ? (
                <div className="space-y-4">
                  {plan.map((day, index) => {
                    const dayNumber = tripDayNumber(day.date, currentVersion?.start_date);
                    const dayBadgeText = dayNumber ?? index + 1;
                    return (
                      <div key={`${day.date}-${index}`} className="flex gap-5 items-start">
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full bg-[#1E3D2F] text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                            {dayBadgeText}
                          </div>
                          {index < plan.length - 1 && (
                            <div className="w-px flex-1 bg-gray-200 mt-1 min-h-[24px]" />
                          )}
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 p-5 flex-1 mb-1">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-xs font-semibold text-[#1E3D2F] bg-green-50 px-2 py-0.5 rounded">
                              {t('trip_detail.day')} {dayBadgeText}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatDateLabel(day.date, lang)}
                            </span>
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
                                        {formatTime(item.start_at, lang)}
                                        {item.end_at ? ` – ${formatTime(item.end_at, lang)}` : ''}
                                      </p>
                                    )}
                                    {item.description && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        {item.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400">{t('trip_detail.no_items_day')}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
                  {t('trip_detail.no_itinerary_yet')}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-2">
                {t('trip_detail.edit_in_concierge')}
              </h3>
              <p className="text-xs text-gray-500 mb-4">{t('trip_detail.edit_concierge_hint')}</p>
              <Link
                href={`/concierge?trip_id=${trip.id}`}
                className="inline-flex w-full items-center justify-center gap-2 px-5 py-2.5 bg-[#1E3D2F] text-white text-sm font-medium rounded-full hover:bg-[#2a5240] transition-colors"
              >
                {t('trip_detail.edit_in_concierge')}
              </Link>
            </div>

            <BookingDocuments documents={documents} headingLevel="h2" />

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">{t('trip_detail.trip_summary')}</h3>
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
                    <p className="text-xs text-gray-500 mt-0.5">{t('trip_detail.nights')}</p>
                  </div>
                )}
                <div className="text-center bg-gray-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-[#1E3D2F]">{plan.length}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{t('trip_detail.days')}</p>
                </div>
                <div className="text-center bg-gray-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-[#1E3D2F]">
                    {allItems.filter((item) => item.item_type === 'activity').length}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{t('trip_detail.activities')}</p>
                </div>
                <div className="text-center bg-gray-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-[#1E3D2F]">
                    {(currentVersion?.adults ?? 0) + (currentVersion?.kids ?? 0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{t('trip_detail.travelers')}</p>
                </div>
              </div>
            </div>

            {latestQuoteId !== null && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-2">{t('trip_detail.your_quote')}</h3>
                <p className="text-xs text-gray-500 mb-4">{t('trip_detail.quote_prepared')}</p>
                <Link
                  href={`/quotes/${latestQuoteId}`}
                  data-testid="trip-detail-view-quote-link"
                  className="block w-full px-5 py-2.5 bg-[#1E3D2F] text-white text-sm font-medium rounded-full hover:bg-[#2a5240] transition-colors text-center"
                >
                  {t('trip_detail.view_quote')}
                </Link>
              </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-2">{t('share_trip.card_title')}</h3>
              <p className="text-xs text-gray-500 mb-4">{t('share_trip.card_hint')}</p>
              <button
                onClick={() => setShowShareModal(true)}
                data-testid="share-trip-button"
                className="inline-flex w-full items-center justify-center gap-2 px-5 py-2.5 border border-[#1E3D2F] text-[#1E3D2F] text-sm font-medium rounded-full hover:bg-[#1E3D2F] hover:text-white transition-colors"
              >
                {t('share_trip.card_cta')}
              </button>
            </div>

            {canCancel && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-2">{t('trip_detail.cancel_trip')}</h3>
                <p className="text-xs text-gray-500 mb-4">{t('trip_detail.cancel_trip_hint')}</p>
                <button
                  onClick={() => setShowCancelDialog(true)}
                  className="w-full px-5 py-2.5 border border-red-200 text-red-600 text-sm font-medium rounded-full hover:bg-red-50 transition-colors"
                >
                  {t('trip_detail.cancel_trip')}
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
