"use client";

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import type { TripContext } from '@/types/ai-chat';
import type { TripDetail } from '@/types/trip';

interface TripDetailPanelProps {
  tripId: number | null;
  tripContext: TripContext | null;
}

export default function TripDetailPanel({ tripId, tripContext }: TripDetailPanelProps) {
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
  }, [tripId]);

  return (
    <div className="w-[420px] flex flex-col bg-[#FAFAF8] overflow-y-auto">
      <div className="px-8 py-8 flex-1">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-cormorant text-2xl font-semibold text-[#1E3D2F]">Your Itinerary</h2>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E3D2F] mx-auto mb-4" />
            <p className="font-inter text-sm text-gray-400">Loading trip details...</p>
          </div>
        )}

        {!loading && tripDetail && tripDetail.status !== 'draft' && (
          <div className="space-y-3 mb-8">
            {(tripDetail.preset_destination_cities || tripDetail.custom_destination_cities) && (
              <div className="flex justify-between font-inter text-sm">
                <span className="text-gray-500">Destination</span>
                <span className="text-[#1E3D2F] font-medium text-right max-w-[200px]">
                  {[tripDetail.preset_destination_cities, tripDetail.custom_destination_cities]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              </div>
            )}

            {tripDetail.start_date && tripDetail.end_date && (
              <div className="flex justify-between font-inter text-sm">
                <span className="text-gray-500">Dates</span>
                <span className="text-[#1E3D2F] font-medium">
                  {new Date(tripDetail.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
                  {new Date(tripDetail.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            )}

            {tripDetail.adults > 0 && (
              <div className="flex justify-between font-inter text-sm">
                <span className="text-gray-500">Travelers</span>
                <span className="text-[#1E3D2F] font-medium">
                  {tripDetail.adults} {tripDetail.adults === 1 ? 'Adult' : 'Adults'}
                  {tripDetail.kids ? `, ${tripDetail.kids} ${tripDetail.kids === 1 ? 'Kid' : 'Kids'}` : ''}
                </span>
              </div>
            )}

            {tripDetail.purpose && (
              <div className="flex justify-between font-inter text-sm">
                <span className="text-gray-500">Purpose</span>
                <span className="text-[#1E3D2F] font-medium">{tripDetail.purpose}</span>
              </div>
            )}

            {tripDetail.budget && tripDetail.budget > 0 && (
              <div className="flex justify-between font-inter text-sm">
                <span className="text-gray-500">Budget</span>
                <span className="text-[#1E3D2F] font-medium">${tripDetail.budget.toLocaleString()}</span>
              </div>
            )}

            {tripDetail.status && (
              <div className="flex justify-between font-inter text-sm">
                <span className="text-gray-500">Status</span>
                <span className="text-[#1E3D2F] font-medium capitalize">
                  {tripDetail.status.split('-').join(' ')}
                </span>
              </div>
            )}

            {/* Travel Plans */}
            {tripDetail.travel_plans && tripDetail.travel_plans.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h3 className="font-cormorant text-lg font-semibold text-[#1E3D2F] mb-3">Travel Plans</h3>
                <div className="space-y-2">
                  {tripDetail.travel_plans.map((plan, idx) => (
                    <div key={plan.id || idx} className="bg-white rounded-lg p-3 border border-gray-100">
                      <p className="font-inter text-sm font-medium text-[#1E3D2F]">{plan.day_topic || `Day ${plan.sort || idx + 1}`}</p>
                      {plan.items && plan.items.length > 0 && (
                        <p className="font-inter text-xs text-gray-500 mt-1">
                          {plan.items.length} activit{plan.items.length === 1 ? 'y' : 'ies'}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Show trip context from active chat when trip is still being created */}
        {!loading && (!tripDetail || tripDetail.status === 'draft') && tripContext && (
          <div className="space-y-3 mb-8">
            {tripContext.destination && (
              <div className="flex justify-between font-inter text-sm">
                <span className="text-gray-500">Destination</span>
                <span className="text-[#1E3D2F] font-medium">{tripContext.destination}</span>
              </div>
            )}
            {tripContext.start_date && tripContext.end_date && (
              <div className="flex justify-between font-inter text-sm">
                <span className="text-gray-500">Dates</span>
                <span className="text-[#1E3D2F] font-medium">
                  {new Date(tripContext.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
                  {new Date(tripContext.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            )}
            {tripContext.adults && (
              <div className="flex justify-between font-inter text-sm">
                <span className="text-gray-500">Travelers</span>
                <span className="text-[#1E3D2F] font-medium">
                  {tripContext.adults} {tripContext.adults === 1 ? 'Adult' : 'Adults'}
                  {tripContext.kids ? `, ${tripContext.kids} ${tripContext.kids === 1 ? 'Kid' : 'Kids'}` : ''}
                </span>
              </div>
            )}
            {tripContext.purpose && (
              <div className="flex justify-between font-inter text-sm">
                <span className="text-gray-500">Purpose</span>
                <span className="text-[#1E3D2F] font-medium">{tripContext.purpose}</span>
              </div>
            )}
            {tripContext.budget && (
              <div className="flex justify-between font-inter text-sm">
                <span className="text-gray-500">Budget</span>
                <span className="text-[#1E3D2F] font-medium">${tripContext.budget.toLocaleString()}</span>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!loading && (!tripDetail || tripDetail.status === 'draft') && !tripContext && (
          <div className="text-center py-12">
            <p className="font-inter text-sm text-gray-400">
              Start planning your trip by chatting with our AI concierge!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
