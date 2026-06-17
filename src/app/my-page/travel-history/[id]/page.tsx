'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Footer from '@/components/Footer';
import { apiClient } from '@/lib/api-client';
import type { TripPlanItem } from '@/types/trip';
import {
  collectTripDocuments,
  getTripReviewableItems,
  getTripWithVersion,
  toReviewableEntities,
  tripDayNumber,
  type TripWithVersion,
} from '@/lib/trip-utils';
import { STAY_CREDIT_SOURCE_LABELS, creditsForTrip, type StayCredit } from '@/types/stay-credit';
import { useLanguage, type Lang } from '@/contexts/LanguageContext';
import { formatDate as formatDateI18n, formatTime as formatTimeI18n } from '@/lib/format-date';
import BookingDocuments from '@/components/BookingDocuments';

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

function formatDate(dateStr: string | undefined, lang: Lang): string {
  if (!dateStr) return '—';
  return formatDateI18n(dateStr, lang, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDayDate(dateStr: string, lang: Lang): string {
  return formatDateI18n(dateStr, lang, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(dateStr: string | null | undefined, lang: Lang): string | undefined {
  if (!dateStr) return undefined;
  return formatTimeI18n(dateStr, lang, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatCredit(amountCents: number, currency: string): string {
  return `${currency} ${(amountCents / 100).toFixed(2)}`;
}

export default function TravelHistoryTripDetailPage() {
  const { t, lang } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const [tripWithVersion, setTripWithVersion] = useState<TripWithVersion | null>(null);
  const [reviewStatus, setReviewStatus] = useState<{ reviewed: number; total: number } | null>(
    null,
  );
  const [tripCredits, setTripCredits] = useState<StayCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        const tripId = Number(id);
        const loaded = await getTripWithVersion(tripId);
        setTripWithVersion(loaded);

        try {
          const allCredits = await apiClient.getMyCredits();
          setTripCredits(creditsForTrip(allCredits, tripId));
        } catch {
          setTripCredits([]);
        }

        const entities = toReviewableEntities(getTripReviewableItems(loaded.currentVersion));
        if (entities.length > 0) {
          try {
            const user = await apiClient.getProfile();
            const lists = await Promise.all(
              entities.map((e) =>
                apiClient.getReviewsByEntity(e.entityType, e.entityId).catch(() => null),
              ),
            );
            const reviewed = lists.filter((list) =>
              list?.reviews.some((r) => r.author.id === user.id && r.review.deleted_at == null),
            ).length;
            setReviewStatus({ reviewed, total: entities.length });
          } catch {
            setReviewStatus({ reviewed: 0, total: entities.length });
          }
        }
      } catch {
        setError(t('trip_detail.error_load'));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, t]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
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
        <div className="max-w-5xl mx-auto px-6 mt-8 text-center py-20 text-gray-500">
          <p>{error ?? t('trip_detail.error_not_found')}</p>
          <Link
            href="/my-page/travel-history"
            className="mt-4 inline-block text-[#1E3D2F] hover:underline text-sm"
          >
            {t('trip_detail.back_to_travel_history')}
          </Link>
        </div>
      </div>
    );
  }

  const { trip, currentVersion } = tripWithVersion;
  const isCompleted = trip.status === 'travel-completed';
  const title = currentVersion?.title?.trim() || t('trip_detail.new_trip');
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

  const creditsCurrency = tripCredits[0]?.currency ?? null;
  const creditsTotalCents = tripCredits.reduce((acc, c) => acc + c.amount_cents, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 md:px-6 mt-8 mb-16">
        <Link
          href="/my-page/travel-history"
          className="text-sm text-gray-500 hover:text-gray-900 mb-6 inline-block"
        >
          {t('trip_detail.travel_history')}
        </Link>

        <div className="bg-[#1E3D2F] rounded-2xl overflow-hidden flex flex-col md:flex-row mb-8">
          <div className="w-full md:w-72 md:flex-shrink-0 bg-gradient-to-br from-[#2a5240] to-[#C4956A] min-h-[200px] flex items-center justify-center">
            <span className="text-white text-3xl font-bold px-6 text-center">{title}</span>
          </div>
          <div className="flex-1 p-6 md:p-10 text-white flex flex-col justify-center">
            <p className="text-sm uppercase tracking-widest text-white/60 mb-2">
              {t('trip_detail.completed_trip')}
            </p>
            <h1 className="text-2xl md:text-4xl font-bold mb-4">{title}</h1>
            <div className="flex flex-wrap gap-8 text-sm">
              <div>
                <p className="text-white/50">{t('trip_detail.dates')}</p>
                <p className="font-semibold">
                  {formatDate(startDate, lang)} – {formatDate(endDate, lang)}
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
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {plan.length > 0 ? (
              <>
                <h2 className="text-xl font-bold text-gray-900">{t('trip_detail.itinerary')}</h2>
                {plan.map((day, index) => {
                  const dayNumber = tripDayNumber(day.date, currentVersion?.start_date);
                  const dayBadgeText = dayNumber ?? index + 1;
                  return (
                    <div key={`${day.date}-${index}`} className="flex gap-4 items-start">
                      <div className="flex flex-col items-center">
                        <div className="w-9 h-9 rounded-full bg-[#1E3D2F] text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
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
                            {formatDayDate(day.date, lang)}
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
                                    <p className="text-xs text-gray-500 mt-1">{item.description}</p>
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
              </>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
                {t('trip_detail.no_itinerary')}
              </div>
            )}
          </div>

          <div className="space-y-5">
            {isCompleted && reviewStatus && reviewStatus.total > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="mb-2 font-semibold text-gray-900">
                  {t('trip_detail.review_experience')}
                </h3>
                <p className="mb-3 text-sm text-gray-500">
                  {reviewStatus.reviewed === reviewStatus.total
                    ? t('trip_detail.all_reviewed')
                    : t('trip_detail.partial_reviewed')
                        .replace('{done}', String(reviewStatus.reviewed))
                        .replace('{total}', String(reviewStatus.total))}
                </p>
                <Link
                  href={`/my-page/travel-history/${trip.id}/reviews`}
                  className="inline-block rounded-full bg-[#1E3D2F] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#2a5240]"
                >
                  {t('trip_detail.review_experience')}
                </Link>
              </div>
            )}

            {tripCredits.length > 0 && creditsCurrency && (
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="mb-3 font-semibold text-gray-900">
                  {t('trip_detail.credits_earned')}
                </h3>
                <div className="space-y-2">
                  {tripCredits.map((credit) => (
                    <div key={credit.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        {STAY_CREDIT_SOURCE_LABELS[credit.source][lang]}
                      </span>
                      <span className="font-medium text-[#1E3D2F]">
                        {formatCredit(credit.amount_cents, credit.currency)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-sm">
                  <span className="font-semibold text-gray-900">{t('trip_detail.total')}</span>
                  <span className="font-primary text-lg italic text-[#1E3D2F]">
                    {formatCredit(creditsTotalCents, creditsCurrency)}
                  </span>
                </div>
                <Link
                  href="/my-page/credits"
                  className="mt-3 inline-block text-xs font-medium text-[#C4956A] hover:underline"
                >
                  {t('trip_detail.view_all_credits')}
                </Link>
              </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">{t('trip_detail.trip_summary')}</h3>
              <div className="grid grid-cols-2 gap-3">
                {nights !== null && (
                  <div className="text-center bg-gray-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-[#1E3D2F]">{nights}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{t('trip_detail.nights')}</p>
                  </div>
                )}
                <div className="text-center bg-gray-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-[#1E3D2F]">{plan.length}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{t('trip_detail.days')}</p>
                </div>
                <div className="text-center bg-gray-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-[#1E3D2F]">{activitiesCount}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{t('trip_detail.activities')}</p>
                </div>
                <div className="text-center bg-gray-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-[#1E3D2F]">{adults + kids}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{t('trip_detail.travelers')}</p>
                </div>
              </div>
            </div>

            <BookingDocuments documents={documents} headingLevel="h3" />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
