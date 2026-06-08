'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Footer from '@/components/Footer';
import { ITEM_COLORS, ITEM_LABELS, formatDateLabel, formatTime } from '@/lib/trip-display';
import { tripDayNumber } from '@/lib/trip-utils';
import { apiClient } from '@/lib/api-client';
import { formatCurrency } from '@/lib/format-currency';
import { useLanguage } from '@/contexts/LanguageContext';
import type { SharedTripDetail } from '@/types/trip-share';

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

function getNights(startDate?: string | null, endDate?: string | null): number | null {
  if (!startDate || !endDate) return null;
  const diff = new Date(endDate).getTime() - new Date(startDate).getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function SharedTripDetailPage() {
  const { t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const [detail, setDetail] = useState<SharedTripDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionStatus === 'loading') return;
    // Auth gate: unauthenticated recipients sign in first, then return here.
    if (sessionStatus === 'unauthenticated') {
      router.push(`/sign-in?callbackUrl=${encodeURIComponent(`/shared-trips/${id}`)}`);
      return;
    }
    if (!id) return;

    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiClient.getSharedTripDetail(Number(id));
        if (!cancelled) setDetail(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t('shared_trip_detail.error_load'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id, sessionStatus, router, t]);

  if (sessionStatus !== 'authenticated' || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 mt-8 space-y-4 animate-pulse">
          <div className="h-56 bg-gray-200 rounded-2xl" />
          <div className="h-40 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 mt-8 text-center py-20 text-gray-500">
          <p>{error ?? t('shared_trip_detail.error_not_found')}</p>
          <Link
            href="/my-page/shared-trips"
            className="mt-4 inline-block text-[#1E3D2F] hover:underline text-sm"
          >
            {t('shared_trip_detail.back_to_shared')}
          </Link>
        </div>
      </div>
    );
  }

  const version = detail.current_version;
  const plan = version?.plan ?? [];
  const nights = getNights(version?.start_date, version?.end_date);
  const statusLabel = STATUS_LABELS[detail.status] ?? detail.status;
  const title = version?.title?.trim() || t('shared_trip_detail.untitled');
  // Cost is rendered inline from the quote's current pricing version — the
  // recipient is NOT the quote owner, so the /quotes/{id} route would 404 for
  // them. The backend only populates active_quote when show_cost is True.
  const costSnapshot = detail.active_quote?.current_version?.total_snapshot ?? null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 mt-8 mb-16 space-y-6">
        <Link
          href="/my-page/shared-trips"
          className="text-sm text-gray-500 hover:text-gray-900 inline-block"
        >
          {t('shared_trip_detail.back_to_shared')}
        </Link>

        <div className="bg-[#1E3D2F] rounded-2xl overflow-hidden flex flex-col md:flex-row">
          <div className="w-full md:w-[480px] md:flex-shrink-0 relative">
            <div className="w-full h-full min-h-[240px] bg-gradient-to-br from-[#2a5240] to-[#C4956A] flex items-center justify-center">
              <span className="text-white text-2xl font-bold px-6 text-center">{title}</span>
            </div>
          </div>
          <div className="flex-1 p-6 md:p-10 text-white flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2">
              <p className="text-sm uppercase tracking-widest text-white/60">
                {t('shared_trip_detail.read_only')}
              </p>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/15 text-white">
                {statusLabel}
              </span>
            </div>
            <h1 className="text-2xl md:text-4xl font-bold mb-4">{title}</h1>
            <div className="flex flex-wrap gap-8 text-sm">
              <div>
                <p className="text-white/50">{t('shared_trip_detail.dates')}</p>
                <p className="font-semibold">
                  {formatDate(version?.start_date)} – {formatDate(version?.end_date)}
                </p>
              </div>
              {nights !== null && (
                <div>
                  <p className="text-white/50">{t('shared_trip_detail.duration')}</p>
                  <p className="font-semibold">
                    {nights} {nights === 1 ? t('common.night') : t('common.nights')}
                  </p>
                </div>
              )}
              <div>
                <p className="text-white/50">{t('shared_trip_detail.travelers')}</p>
                <p className="font-semibold">
                  {version?.adults ?? 0}{' '}
                  {(version?.adults ?? 0) === 1 ? t('common.adult') : t('common.adults')}
                  {version?.kids
                    ? `, ${version.kids} ${version.kids === 1 ? t('common.kid') : t('common.kids')}`
                    : ''}
                </p>
              </div>
              {detail.created_by_email && (
                <div>
                  <p className="text-white/50">{t('shared_trip_detail.shared_by')}</p>
                  <p className="font-semibold">{detail.created_by_email}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-5">
                {t('shared_trip_detail.itinerary')}
              </h2>
              {plan.length > 0 ? (
                <div className="space-y-4">
                  {plan.map((day, index) => {
                    const dayNumber = tripDayNumber(day.date, version?.start_date);
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
                              {t('shared_trip_detail.day')} {dayBadgeText}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatDateLabel(day.date)}
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
                                        {formatTime(item.start_at)}
                                        {item.end_at ? ` – ${formatTime(item.end_at)}` : ''}
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
                            <p className="text-sm text-gray-400">
                              {t('shared_trip_detail.no_items_day')}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
                  {t('shared_trip_detail.no_itinerary')}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {detail.show_booking_documents && detail.booking_documents.length > 0 && (
              <div
                className="bg-white rounded-xl border border-gray-200 p-6"
                data-testid="shared-docs"
              >
                <h2 className="text-xl font-bold text-gray-900 mb-3">
                  {t('shared_trip_detail.booking_documents')}
                </h2>
                <div className="space-y-2">
                  {detail.booking_documents.map((document, index) => (
                    <a
                      key={`${document.file}-${index}`}
                      href={document.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-[#1E3D2F] hover:underline"
                    >
                      <span>📄</span>
                      <span className="truncate">
                        {document.file_name ||
                          document.document_type ||
                          t('shared_trip_detail.document_fallback').replace(
                            '{n}',
                            String(index + 1),
                          )}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {detail.show_cost && costSnapshot && (
              <div
                className="bg-white rounded-xl border border-gray-200 p-5"
                data-testid="shared-quote"
              >
                <h3 className="font-semibold text-gray-900 mb-2">{t('shared_trip_detail.cost')}</h3>
                <p className="text-xs text-gray-500 mb-4">{t('shared_trip_detail.cost_hint')}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>{t('shared_trip_detail.subtotal')}</span>
                    <span>{formatCurrency(costSnapshot.subtotal, costSnapshot.currency)}</span>
                  </div>
                  {costSnapshot.fees.map((fee, idx) => (
                    <div key={`fee-${idx}`} className="flex justify-between text-gray-600">
                      <span>{fee.label}</span>
                      <span>+{formatCurrency(fee.amount, costSnapshot.currency)}</span>
                    </div>
                  ))}
                  {costSnapshot.discounts.map((discount, idx) => (
                    <div key={`discount-${idx}`} className="flex justify-between text-emerald-700">
                      <span>{discount.label}</span>
                      <span>−{formatCurrency(discount.amount, costSnapshot.currency)}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 pt-3 mt-1 flex justify-between text-base font-bold text-gray-900">
                    <span>{t('shared_trip_detail.total')}</span>
                    <span>{formatCurrency(costSnapshot.total, costSnapshot.currency)}</span>
                  </div>
                </div>
              </div>
            )}

            {!detail.show_cost && (
              <div className="bg-gray-100 rounded-xl border border-gray-200 p-5 text-xs text-gray-500">
                {t('shared_trip_detail.cost_hidden')}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
