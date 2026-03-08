"use client";

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { useLanguage } from '@/contexts/LanguageContext';
import type { TripContext } from '@/types/ai-chat';
import type { TripDetail } from '@/types/trip';

/** Parse "YYYY-MM-DD" as local date (avoids UTC midnight → previous day in western timezones) */
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// ── Journey Stepper ─────────────────────────────────────────────────────

const JOURNEY_STEPS = [
  { key: 'draft',                  label: 'Planning' },
  { key: 'waiting-for-proposal',   label: 'Submitted' },
  { key: 'in-progress',            label: 'Proposal' },
  { key: 'waiting-for-payment',    label: 'Payment' },
  { key: 'ready-for-travel',       label: 'Ready' },
  { key: 'traveling-now',          label: 'Traveling' },
  { key: 'travel-completed',       label: 'Completed' },
] as const;

// Map backend statuses that fall between visible steps
const STATUS_TO_STEP: Record<string, string> = {
  'draft':                      'draft',
  'waiting-for-proposal':       'waiting-for-proposal',
  'in-progress':                'in-progress',
  'waiting-for-payment':        'waiting-for-payment',
  'waiting_for_booking_docs':   'waiting-for-payment',
  'ready-for-travel':           'ready-for-travel',
  'traveling-now':              'traveling-now',
  'travel-completed':           'travel-completed',
  'canceled':                   'canceled',
};

function JourneyStepper({ status }: { status: string | null }) {
  if (!status) return null;

  const mappedStatus = STATUS_TO_STEP[status] || status;
  const currentIdx = JOURNEY_STEPS.findIndex(s => s.key === mappedStatus);
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
          const isFuture = currentIdx < 0 || idx > currentIdx;

          return (
            <div key={step.key} className="flex flex-col items-center z-10" style={{ width: `${100 / JOURNEY_STEPS.length}%` }}>
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
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="2,6 5,9 10,3" />
                  </svg>
                )}
                {isCurrent && !isCanceled && (
                  <div className="w-[6px] h-[6px] rounded-full bg-white" />
                )}
                {isCanceled && isCurrent && (
                  <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
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
  tripId: number | null;
  tripContext: TripContext | null;
  refreshKey?: number;
}

export default function TripDetailPanel({ tripId, tripContext, refreshKey }: TripDetailPanelProps) {
  const { t } = useLanguage();
  const [tripDetail, setTripDetail] = useState<TripDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tripId) {
      setTripDetail(null);
      return;
    }

    let cancelled = false;
    const fetchTrip = async () => {
      setLoading(true);
      try {
        const detail = await apiClient.getTripById(tripId);
        if (!cancelled) setTripDetail(detail);
      } catch (err) {
        console.error('[TripDetailPanel] Failed to fetch trip:', err);
        if (!cancelled) setTripDetail(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchTrip();
    return () => { cancelled = true; };
  }, [tripId, refreshKey]);

  return (
    <div className="w-[420px] flex flex-col bg-[#FAFAF8] overflow-y-auto">
      <div className="px-8 py-8 flex-1">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-cormorant text-2xl font-semibold text-[#1E3D2F]">{t('chat.itinerary_title')}</h2>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E3D2F] mx-auto mb-4" />
            <p className="font-inter text-sm text-gray-400">{t('chat.loading')}</p>
          </div>
        )}

        {!loading && tripDetail && (
          <div className="space-y-3 mb-8">
            {tripDetail.status && (
              <div className="mb-2">
                <JourneyStepper status={tripDetail.status} />
              </div>
            )}

            {(tripDetail.preset_destination_cities_names || tripDetail.custom_destination_cities) && (
              <div className="flex justify-between font-inter text-sm">
                <span className="text-gray-500">{t('chat.destination')}</span>
                <span className="text-[#1E3D2F] font-medium text-right max-w-[200px]">
                  {[tripDetail.preset_destination_cities_names, tripDetail.custom_destination_cities]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              </div>
            )}

            {tripDetail.start_date && tripDetail.end_date && (
              <div className="flex justify-between font-inter text-sm">
                <span className="text-gray-500">{t('chat.dates')}</span>
                <span className="text-[#1E3D2F] font-medium">
                  {parseLocalDate(tripDetail.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
                  {parseLocalDate(tripDetail.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            )}

            {tripDetail.adults > 0 && (
              <div className="flex justify-between font-inter text-sm">
                <span className="text-gray-500">{t('chat.travelers')}</span>
                <span className="text-[#1E3D2F] font-medium">
                  {tripDetail.adults} {tripDetail.adults === 1 ? t('common.adult') : t('common.adults')}
                  {tripDetail.kids ? `, ${tripDetail.kids} ${tripDetail.kids === 1 ? t('common.kid') : t('common.kids')}` : ''}
                </span>
              </div>
            )}

            {tripDetail.purpose && (
              <div className="flex justify-between font-inter text-sm">
                <span className="text-gray-500">{t('chat.purpose')}</span>
                <span className="text-[#1E3D2F] font-medium">{tripDetail.purpose}</span>
              </div>
            )}

            {tripDetail.budget && tripDetail.budget > 0 && (
              <div className="flex justify-between font-inter text-sm">
                <span className="text-gray-500">{t('chat.budget')}</span>
                <span className="text-[#1E3D2F] font-medium">${tripDetail.budget.toLocaleString()}</span>
              </div>
            )}

            {tripDetail.specific_hotel_requests && (
              <div className="flex justify-between font-inter text-sm">
                <span className="text-gray-500">{t('chat.hotel')}</span>
                <span className="text-[#1E3D2F] font-medium text-right max-w-[200px]">
                  {tripDetail.specific_hotel_requests}
                </span>
              </div>
            )}

            {/* Travel Plans */}
            {tripDetail.travel_plans && tripDetail.travel_plans.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h3 className="font-cormorant text-lg font-semibold text-[#1E3D2F] mb-3">{t('chat.travel_plans')}</h3>
                <div className="space-y-2">
                  {tripDetail.travel_plans.map((plan, idx) => (
                    <div key={plan.id || idx} className="bg-white rounded-lg p-3 border border-gray-100">
                      <p className="font-inter text-sm font-medium text-[#1E3D2F]">{plan.day_topic || `${t('chat.day')} ${plan.sort || idx + 1}`}</p>
                      {plan.items && plan.items.length > 0 && (
                        <p className="font-inter text-xs text-gray-500 mt-1">
                          {plan.items.length === 1 ? t('chat.activities_one') : `${plan.items.length} ${t('chat.activities_other')}`}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Show trip context from active chat when no trip is saved yet */}
        {!loading && !tripDetail && tripContext && (
          <div className="space-y-3 mb-8">
            {tripContext.destination && (
              <div className="flex justify-between font-inter text-sm">
                <span className="text-gray-500">{t('chat.destination')}</span>
                <span className="text-[#1E3D2F] font-medium">{tripContext.destination}</span>
              </div>
            )}
            {tripContext.start_date && tripContext.end_date && (
              <div className="flex justify-between font-inter text-sm">
                <span className="text-gray-500">{t('chat.dates')}</span>
                <span className="text-[#1E3D2F] font-medium">
                  {parseLocalDate(tripContext.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
                  {parseLocalDate(tripContext.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            )}
            {(tripContext.adults ?? 0) > 0 && (
              <div className="flex justify-between font-inter text-sm">
                <span className="text-gray-500">{t('chat.travelers')}</span>
                <span className="text-[#1E3D2F] font-medium">
                  {tripContext.adults} {tripContext.adults === 1 ? t('common.adult') : t('common.adults')}
                  {tripContext.kids ? `, ${tripContext.kids} ${tripContext.kids === 1 ? t('common.kid') : t('common.kids')}` : ''}
                </span>
              </div>
            )}
            {tripContext.purpose && (
              <div className="flex justify-between font-inter text-sm">
                <span className="text-gray-500">{t('chat.purpose')}</span>
                <span className="text-[#1E3D2F] font-medium">{tripContext.purpose}</span>
              </div>
            )}
            {tripContext.budget && (
              <div className="flex justify-between font-inter text-sm">
                <span className="text-gray-500">{t('chat.budget')}</span>
                <span className="text-[#1E3D2F] font-medium">${tripContext.budget.toLocaleString()}</span>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!loading && !tripDetail && !tripContext && (
          <div className="text-center py-12">
            <p className="font-inter text-sm text-gray-400">
              {t('chat.empty_state')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
