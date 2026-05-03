'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { tripDayNumber, type TripWithVersion } from '@/lib/trip-utils';
import { ITEM_COLORS, ITEM_LABELS, formatDateLabel, formatTime } from '@/lib/trip-display';
import type { TripPlanItem } from '@/types/trip';

const FIELD_TO_ROW_KEYS: Record<string, string[]> = {
  destination: ['destination'],
  start_date: ['dates'],
  end_date: ['dates'],
  adults: ['travelers'],
  kids: ['travelers'],
  purpose: ['purpose'],
  service_type: ['purpose'],
};

function rowKeysFromFields(fields: string[]): Set<string> {
  const keys = new Set<string>();
  for (const field of fields) {
    const mapped = FIELD_TO_ROW_KEYS[field];
    if (mapped) mapped.forEach((k) => keys.add(k));
  }
  return keys;
}

/** Parse "YYYY-MM-DD" as local date (avoids UTC midnight → previous day in western timezones) */
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// ── Journey Stepper ─────────────────────────────────────────────────────

const JOURNEY_STEPS = [
  { key: 'draft', label: 'Planning' },
  { key: 'waiting-for-proposal', label: 'Submitted' },
  { key: 'in-progress', label: 'Proposal' },
  { key: 'waiting-for-payment', label: 'Payment' },
  { key: 'ready-for-travel', label: 'Ready' },
  { key: 'traveling-now', label: 'Traveling' },
  { key: 'travel-completed', label: 'Completed' },
] as const;

// Map backend statuses that fall between visible steps
const STATUS_TO_STEP: Record<string, string> = {
  draft: 'draft',
  'waiting-for-proposal': 'waiting-for-proposal',
  'in-progress': 'in-progress',
  'waiting-for-payment': 'waiting-for-payment',
  waiting_for_booking_docs: 'waiting-for-payment',
  'ready-for-travel': 'ready-for-travel',
  'traveling-now': 'traveling-now',
  'travel-completed': 'travel-completed',
  canceled: 'canceled',
};

function JourneyStepper({ status }: { status: string | null }) {
  if (!status) return null;

  const mappedStatus = STATUS_TO_STEP[status] || status;
  const currentIdx = JOURNEY_STEPS.findIndex((s) => s.key === mappedStatus);
  const isCanceled = status === 'canceled';

  return (
    <div className="py-4">
      <div className="flex items-start justify-between relative">
        {/* Background track line */}
        <div className="absolute top-[11px] left-0 right-0 flex px-[calc(100%/14)]">
          <div className="flex-1 h-[2px] bg-gray-200" />
        </div>
        {/* Filled progress line */}
        <div className="absolute top-[11px] left-0 right-0 flex px-[calc(100%/14)]">
          <div
            className="h-[2px] transition-all duration-500"
            style={{
              width: currentIdx > 0 ? `${(currentIdx / (JOURNEY_STEPS.length - 1)) * 100}%` : '0%',
              background: isCanceled ? '#EF4444' : '#C4956A',
            }}
          />
        </div>

        {JOURNEY_STEPS.map((step, idx) => {
          const isCompleted = currentIdx >= 0 && idx < currentIdx;
          const isCurrent = idx === currentIdx;

          return (
            <div
              key={step.key}
              className="flex flex-col items-center z-10"
              style={{ width: `${100 / JOURNEY_STEPS.length}%` }}
            >
              {/* Circle */}
              <div
                className={`w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                  isCanceled && isCurrent
                    ? 'border-red-500 bg-red-500'
                    : isCompleted
                      ? 'border-[#C4956A] bg-[#C4956A]'
                      : isCurrent
                        ? 'border-[#1E3D2F] bg-[#1E3D2F]'
                        : 'border-gray-300 bg-white'
                }`}
              >
                {isCompleted && (
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="2,6 5,9 10,3" />
                  </svg>
                )}
                {isCurrent && !isCanceled && (
                  <div className="w-[6px] h-[6px] rounded-full bg-white" />
                )}
                {isCanceled && isCurrent && (
                  <svg
                    width="8"
                    height="8"
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <line x1="3" y1="3" x2="9" y2="9" />
                    <line x1="9" y1="3" x2="3" y2="9" />
                  </svg>
                )}
              </div>

              {/* Label */}
              <span
                className={`font-inter text-[9px] mt-1.5 text-center leading-tight ${
                  isCanceled && isCurrent
                    ? 'text-red-500 font-semibold'
                    : isCompleted
                      ? 'text-[#C4956A] font-medium'
                      : isCurrent
                        ? 'text-[#1E3D2F] font-semibold'
                        : 'text-gray-400'
                }`}
              >
                {isCanceled && isCurrent ? 'Canceled' : step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface TripDetailPanelProps {
  tripDetail: TripWithVersion | null;
  onSubmitTrip?: () => void;
  isLoading?: boolean;
  highlightedFields?: string[];
  highlightToken?: number;
}

export default function TripDetailPanel({
  tripDetail,
  onSubmitTrip,
  isLoading,
  highlightedFields,
  highlightToken,
}: TripDetailPanelProps) {
  const { t } = useLanguage();
  const plan = tripDetail?.currentVersion?.plan ?? [];

  const [expiredToken, setExpiredToken] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!highlightedFields || highlightedFields.length === 0) return;
    const rows = rowKeysFromFields(highlightedFields);
    if (rows.size === 0) return;
    const timer = setTimeout(() => setExpiredToken(highlightToken), 2000);
    return () => clearTimeout(timer);
  }, [highlightedFields, highlightToken]);

  const activeHighlights = useMemo<Set<string>>(() => {
    if (!highlightedFields || highlightedFields.length === 0) return new Set();
    if (expiredToken !== undefined && expiredToken === highlightToken) return new Set();
    return rowKeysFromFields(highlightedFields);
  }, [highlightedFields, highlightToken, expiredToken]);

  const highlightClass = (key: string) =>
    activeHighlights.has(key)
      ? 'bg-amber-100 transition-colors duration-500'
      : 'transition-colors duration-500';

  return (
    <div className="w-[420px] flex flex-col bg-[#FAFAF8] overflow-y-auto">
      <div className="px-8 py-8 flex-1">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-cormorant text-2xl font-semibold text-[#1E3D2F]">
            {t('chat.itinerary_title')}
          </h2>
        </div>

        {tripDetail && (
          <div className="space-y-3 mb-8">
            {tripDetail.trip.status && (
              <div className="mb-2">
                <JourneyStepper status={tripDetail.trip.status} />
              </div>
            )}

            <div className="flex justify-end -mt-2 mb-1">
              <Link
                href={`/my-page/trip/${tripDetail.trip.id}`}
                data-testid="trip-detail-panel-view-trip-link"
                className="font-inter text-[11px] text-[#1E3D2F] hover:text-[#C4956A] underline underline-offset-2 transition-colors"
              >
                {t('chat.view_trip_details')}
              </Link>
            </div>

            {(tripDetail.currentVersion?.title?.trim() || 'New Trip') && (
              <div
                className={`flex justify-between font-inter text-sm rounded px-2 -mx-2 py-1 ${highlightClass('destination')}`}
                data-testid="trip-row-destination"
              >
                <span className="text-gray-500">{t('chat.destination')}</span>
                <span className="text-[#1E3D2F] font-medium text-right max-w-[200px]">
                  {tripDetail.currentVersion?.title?.trim() || 'New Trip'}
                </span>
              </div>
            )}

            {tripDetail.currentVersion?.start_date && tripDetail.currentVersion?.end_date && (
              <div
                className={`flex justify-between font-inter text-sm rounded px-2 -mx-2 py-1 ${highlightClass('dates')}`}
                data-testid="trip-row-dates"
              >
                <span className="text-gray-500">{t('chat.dates')}</span>
                <span className="text-[#1E3D2F] font-medium">
                  {parseLocalDate(tripDetail.currentVersion.start_date).toLocaleDateString(
                    'en-US',
                    {
                      month: 'short',
                      day: 'numeric',
                    },
                  )}{' '}
                  –{' '}
                  {parseLocalDate(tripDetail.currentVersion.end_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            )}

            {(tripDetail.currentVersion?.adults ?? 0) > 0 && (
              <div
                className={`flex justify-between font-inter text-sm rounded px-2 -mx-2 py-1 ${highlightClass('travelers')}`}
                data-testid="trip-row-travelers"
              >
                <span className="text-gray-500">{t('chat.travelers')}</span>
                <span className="text-[#1E3D2F] font-medium">
                  {tripDetail.currentVersion?.adults ?? 0}{' '}
                  {(tripDetail.currentVersion?.adults ?? 0) === 1
                    ? t('common.adult')
                    : t('common.adults')}
                  {(tripDetail.currentVersion?.kids ?? 0)
                    ? `, ${tripDetail.currentVersion?.kids ?? 0} ${(tripDetail.currentVersion?.kids ?? 0) === 1 ? t('common.kid') : t('common.kids')}`
                    : ''}
                </span>
              </div>
            )}

            {tripDetail.currentVersion?.summary && (
              <div
                className={`flex justify-between font-inter text-sm rounded px-2 -mx-2 py-1 ${highlightClass('purpose')}`}
                data-testid="trip-row-purpose"
              >
                <span className="text-gray-500">{t('chat.purpose')}</span>
                <span className="text-[#1E3D2F] font-medium">
                  {tripDetail.currentVersion.summary}
                </span>
              </div>
            )}

            {/* Travel Plans — detailed day-by-day view */}
            {plan.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h3 className="font-cormorant text-lg font-semibold text-[#1E3D2F] mb-3">
                  {t('chat.travel_plans')}
                </h3>
                <div className="space-y-3">
                  {plan.map((day, dayIdx) => {
                    const dayNumber = tripDayNumber(
                      day.date,
                      tripDetail?.currentVersion?.start_date,
                    );
                    return (
                      <div
                        key={`${day.date}-${dayIdx}`}
                        data-testid={`trip-day-${dayIdx}`}
                        className="bg-white rounded-lg p-3 border border-gray-100"
                      >
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {dayNumber !== null && (
                            <span className="font-inter text-[10px] font-semibold text-[#1E3D2F] bg-green-50 px-1.5 py-0.5 rounded">
                              {t('chat.day')} {dayNumber}
                            </span>
                          )}
                          <span className="font-inter text-[11px] text-gray-400">
                            {formatDateLabel(day.date)}
                          </span>
                          {day.title && (
                            <span className="font-inter text-[11px] font-medium text-gray-700 truncate">
                              {day.title}
                            </span>
                          )}
                        </div>
                        {day.items.length > 0 ? (
                          <div className="space-y-2">
                            {day.items.map((item: TripPlanItem, itemIdx) => (
                              <div
                                key={`${day.date}-${itemIdx}`}
                                data-testid={`trip-plan-item-${item.item_type}-${itemIdx}`}
                                className="flex items-start gap-2"
                              >
                                <span
                                  className={`font-inter text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 mt-0.5 ${ITEM_COLORS[item.item_type]}`}
                                >
                                  {ITEM_LABELS[item.item_type]}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="font-inter text-xs font-medium text-[#1E3D2F] truncate">
                                    {item.title || ITEM_LABELS[item.item_type]}
                                  </p>
                                  {item.location && (
                                    <p className="font-inter text-[11px] text-gray-400 truncate">
                                      {item.location}
                                    </p>
                                  )}
                                  {item.start_at && (
                                    <p className="font-inter text-[11px] text-gray-400">
                                      {formatTime(item.start_at)}
                                      {item.end_at ? ` – ${formatTime(item.end_at)}` : ''}
                                    </p>
                                  )}
                                  {item.description && (
                                    <p className="font-inter text-[11px] text-gray-500 mt-1 line-clamp-2">
                                      {item.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="font-inter text-[11px] text-gray-400">
                            {t('chat.no_items_today')}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Submit Trip Button — only for drafts */}
            {tripDetail.trip.status === 'draft' && onSubmitTrip && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="font-inter text-xs text-gray-500 mb-3">
                  {t('chat.submit_trip_hint')}
                </p>
                <button
                  onClick={onSubmitTrip}
                  disabled={isLoading}
                  className="w-full py-2.5 bg-[#1E3D2F] text-white text-sm font-medium rounded-full hover:bg-[#2a5240] transition-colors disabled:opacity-50"
                >
                  {t('chat.submit_trip')}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!tripDetail && (
          <div className="text-center py-12">
            <p className="font-inter text-sm text-gray-400">{t('chat.empty_state')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
