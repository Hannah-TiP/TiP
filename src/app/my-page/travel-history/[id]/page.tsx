"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import SubNav from "@/components/SubNav";
import Footer from "@/components/Footer";
import { apiClient } from "@/lib/api-client";
import type { TripDetail, TravelPlanItem } from "@/types/trip";
import { getImageUrl } from "@/types/hotel";

function getNights(startDate?: string, endDate?: string): number | null {
  if (!startDate || !endDate) return null;
  const diff = new Date(endDate).getTime() - new Date(startDate).getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDayDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function getDestination(trip: TripDetail): string {
  return (
    trip.preset_destination_cities_names ||
    trip.custom_destination_cities ||
    "Trip"
  );
}

const categoryLabel: Record<string, string> = {
  flight: "Flight",
  staying: "Hotel",
  activities: "Activity",
  others: "Other",
};

const categoryColor: Record<string, string> = {
  flight: "bg-blue-100 text-blue-700",
  staying: "bg-purple-100 text-purple-700",
  activities: "bg-green-100 text-green-700",
  others: "bg-gray-100 text-gray-600",
};

function CostRow({ label, value }: { label: string; value?: number }) {
  if (!value) return null;
  return (
    <div className="flex justify-between text-sm py-2 border-b border-gray-100 last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">${value.toLocaleString()}</span>
    </div>
  );
}

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    apiClient
      .getTripById(Number(id))
      .then(setTrip)
      .catch(() => setError("Failed to load trip details."))
      .finally(() => setLoading(false));
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

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopBar activeLink="My Page" />
        <SubNav activeTab="Travel History" />
        <div className="max-w-5xl mx-auto px-6 mt-8 text-center py-20 text-gray-500">
          <p>{error ?? "Trip not found."}</p>
          <Link href="/my-page/travel-history" className="mt-4 inline-block text-[#1E3D2F] hover:underline text-sm">
            ← Back to Travel History
          </Link>
        </div>
      </div>
    );
  }

  const destination = getDestination(trip);
  const nights = getNights(trip.start_date, trip.end_date);
  const sortedPlans = [...(trip.travel_plans ?? [])].sort((a, b) => a.sort - b.sort);
  const activitiesCount = sortedPlans.flatMap((p) => p.items).filter((i) => i.category_type === "activities").length;

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar activeLink="My Page" />
      <SubNav activeTab="Travel History" />

      <div className="max-w-5xl mx-auto px-6 mt-8 mb-16">

        {/* Back */}
        <Link href="/my-page/travel-history" className="text-sm text-gray-500 hover:text-gray-900 mb-6 inline-block">
          ← Travel History
        </Link>

        {/* Hero */}
        <div className="bg-[#1E3D2F] rounded-2xl overflow-hidden flex mb-8">
          <div className="w-72 flex-shrink-0">
            {trip.cover_image ? (
              <img src={getImageUrl(trip.cover_image)} alt={destination} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full min-h-[200px] bg-gradient-to-br from-[#2a5240] to-[#C4956A]" />
            )}
          </div>
          <div className="flex-1 p-10 text-white flex flex-col justify-center">
            <p className="text-sm uppercase tracking-widest text-white/60 mb-2">Completed Trip</p>
            <h1 className="text-4xl font-bold mb-4">{destination}</h1>
            <div className="flex flex-wrap gap-8 text-sm">
              <div>
                <p className="text-white/50">Dates</p>
                <p className="font-semibold">{formatDate(trip.start_date)} – {formatDate(trip.end_date)}</p>
              </div>
              {nights !== null && (
                <div>
                  <p className="text-white/50">Duration</p>
                  <p className="font-semibold">{nights} {nights === 1 ? "Night" : "Nights"}</p>
                </div>
              )}
              <div>
                <p className="text-white/50">Travelers</p>
                <p className="font-semibold">
                  {trip.adults} {trip.adults === 1 ? "Adult" : "Adults"}
                  {trip.kids ? `, ${trip.kids} ${trip.kids === 1 ? "Kid" : "Kids"}` : ""}
                </p>
              </div>
              {trip.purpose && (
                <div>
                  <p className="text-white/50">Purpose</p>
                  <p className="font-semibold capitalize">{trip.purpose}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">

          {/* Itinerary */}
          <div className="col-span-2 space-y-5">
            {sortedPlans.length > 0 ? (
              <>
                <h2 className="text-xl font-bold text-gray-900">Itinerary</h2>
                {sortedPlans.map((plan, i) => (
                  <div key={plan.id} className="flex gap-4 items-start">
                    <div className="flex flex-col items-center">
                      <div className="w-9 h-9 rounded-full bg-[#1E3D2F] text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                        {plan.sort ?? i + 1}
                      </div>
                      {i < sortedPlans.length - 1 && (
                        <div className="w-px flex-1 bg-gray-200 mt-1 min-h-[24px]" />
                      )}
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-5 flex-1 mb-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-xs font-semibold text-[#1E3D2F] bg-green-50 px-2 py-0.5 rounded">
                          Day {plan.sort ?? i + 1}
                        </span>
                        <span className="text-xs text-gray-400">{formatDayDate(plan.date)}</span>
                        {plan.day_topic && (
                          <span className="text-xs font-medium text-gray-700">{plan.day_topic}</span>
                        )}
                      </div>
                      {plan.items.length > 0 ? (
                        <div className="space-y-2">
                          {plan.items.map((item: TravelPlanItem) => (
                            <div key={item.id} className="flex items-start gap-3">
                              <span className={`text-xs px-2 py-0.5 rounded font-medium flex-shrink-0 mt-0.5 ${categoryColor[item.category_type ?? "others"] ?? "bg-gray-100 text-gray-600"}`}>
                                {categoryLabel[item.category_type ?? "others"] ?? "Other"}
                              </span>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{item.category_name}</p>
                                {item.city && (
                                  <p className="text-xs text-gray-400">{item.city}</p>
                                )}
                              </div>
                              {item.estimated_cost != null && (
                                <span className="ml-auto text-xs text-gray-500 flex-shrink-0">
                                  ${item.estimated_cost.toLocaleString()}
                                </span>
                              )}
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

          {/* Sidebar */}
          <div className="space-y-5">

            {/* Stats */}
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
                  <p className="text-2xl font-bold text-[#1E3D2F]">{sortedPlans.length}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Days</p>
                </div>
                <div className="text-center bg-gray-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-[#1E3D2F]">{activitiesCount}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Activities</p>
                </div>
                <div className="text-center bg-gray-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-[#1E3D2F]">{trip.adults + (trip.kids ?? 0)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Travelers</p>
                </div>
              </div>
            </div>

            {/* Cost breakdown */}
            {trip.show_cost !== false && trip.proposal && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-3">Cost Breakdown</h3>
                <CostRow label="Flights" value={trip.proposal.flight_cost} />
                <CostRow label="Accommodation" value={trip.proposal.staying_cost} />
                <CostRow label="Activities" value={trip.proposal.activity_cost} />
                <CostRow label="Other" value={trip.proposal.other_cost} />
                {trip.proposal.coupon_cost != null && trip.proposal.coupon_cost > 0 && (
                  <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                    <span className="text-green-600">Coupon</span>
                    <span className="font-medium text-green-600">-${trip.proposal.coupon_cost.toLocaleString()}</span>
                  </div>
                )}
                {trip.proposal.total_cost != null && (
                  <div className="flex justify-between text-sm pt-3 mt-1">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="font-bold text-[#1E3D2F]">${trip.proposal.total_cost.toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}

            {/* Booking documents */}
            {trip.show_booking_documents !== false && trip.tickets && trip.tickets.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-3">Booking Documents</h3>
                <div className="space-y-2">
                  {trip.tickets.map((ticket, i) => (
                    <a
                      key={i}
                      href={ticket.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-[#1E3D2F] hover:underline"
                    >
                      <span>📄</span>
                      <span className="truncate">{ticket.fileName || `Document ${i + 1}`}</span>
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
