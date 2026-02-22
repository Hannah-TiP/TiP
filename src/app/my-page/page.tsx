"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import SubNav from "@/components/SubNav";
import Footer from "@/components/Footer";
import { apiClient } from "@/lib/api-client";
import type { Trip, TripDetail, TravelPlanItem } from "@/types/trip";
import { getImageUrl } from "@/types/hotel";

const STATUS_PRIORITY = [
  "draft",
  "waiting-for-proposal",
  "in-progress",
  "waiting-for-payment",
  "paid",
  "ready-to-travel",
  "traveling-now",
];

const HAS_PROPOSAL_STATUSES = new Set([
  "in-progress",
  "waiting-for-payment",
  "paid",
  "ready-to-travel",
  "traveling-now",
]);

const STATUS_LABELS: Record<string, string> = {
  "draft": "Planning",
  "waiting-for-proposal": "Awaiting Proposal",
  "in-progress": "In Progress",
  "waiting-for-payment": "Awaiting Payment",
  "paid": "Payment Confirmed",
  "ready-to-travel": "Ready to Travel",
  "traveling-now": "Traveling Now",
};

const STATUS_COLORS: Record<string, string> = {
  "draft": "bg-gray-100 text-gray-600",
  "waiting-for-proposal": "bg-yellow-100 text-yellow-700",
  "in-progress": "bg-blue-100 text-blue-700",
  "waiting-for-payment": "bg-orange-100 text-orange-700",
  "paid": "bg-teal-100 text-teal-700",
  "ready-to-travel": "bg-green-100 text-green-700",
  "traveling-now": "bg-emerald-100 text-emerald-700",
};

const categoryColor: Record<string, string> = {
  flight: "bg-blue-100 text-blue-700",
  staying: "bg-purple-100 text-purple-700",
  activities: "bg-green-100 text-green-700",
  others: "bg-gray-100 text-gray-600",
};

const categoryLabel: Record<string, string> = {
  flight: "Flight",
  staying: "Hotel",
  activities: "Activity",
  others: "Other",
};

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

function getDestination(trip: Trip): string {
  return (
    trip.preset_destination_cities_names ||
    trip.custom_destination_cities ||
    "Your Trip"
  );
}

function pickActiveTrip(trips: Trip[]): Trip | null {
  console.log(trips);
  const active = trips.filter(
    (t) => t.status !== "travel-completed" && t.status !== "canceled"
  );
  if (active.length === 0) return null;
  return active.sort((a, b) => {
    const ai = STATUS_PRIORITY.indexOf(a.status);
    const bi = STATUS_PRIORITY.indexOf(b.status);
    return bi - ai;
  })[0];
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-6 mt-8 mb-16 space-y-8 animate-pulse">
      <div className="h-56 bg-gray-200 rounded-2xl" />
      <div className="grid grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-gray-200 rounded-xl" />
        ))}
      </div>
      <div className="h-6 bg-gray-200 rounded w-1/4" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="max-w-7xl mx-auto px-6 mt-8 mb-16">
      <div className="text-center py-24">
        <p className="text-5xl mb-6">✈️</p>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">No upcoming trips</h2>
        <p className="text-gray-500 mb-8">
          Let our AI concierge craft your perfect journey.
        </p>
        <Link
          href="/concierge"
          className="inline-block px-8 py-3 bg-[#1E3D2F] text-white rounded-full text-sm font-medium hover:bg-[#2a5240] transition-colors"
        >
          Plan a Trip
        </Link>
      </div>
    </div>
  );
}

// ─── Hero Card (shared between Pending and Rich views) ────────────────────────
function HeroCard({ trip, statusLabel, statusColor }: {
  trip: Trip;
  statusLabel: string;
  statusColor: string;
}) {
  const destination = getDestination(trip);
  const nights = getNights(trip.start_date, trip.end_date);

  return (
    <div className="bg-[#1E3D2F] rounded-2xl overflow-hidden flex">
      <div className="w-[480px] flex-shrink-0">
        {trip.cover_image ? (
          <img
            src={getImageUrl(trip.cover_image)}
            alt={destination}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full min-h-[240px] bg-gradient-to-br from-[#2a5240] to-[#C4956A] flex items-center justify-center">
            <span className="text-white text-2xl font-bold px-6 text-center">
              {destination}
            </span>
          </div>
        )}
      </div>
      <div className="flex-1 p-10 text-white flex flex-col justify-center">
        <div className="flex items-center gap-3 mb-2">
          <p className="text-sm uppercase tracking-widest text-white/60">Upcoming Trip</p>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColor}`}>
            {statusLabel}
          </span>
        </div>
        <h1 className="text-4xl font-bold mb-4">{destination}</h1>
        <div className="flex flex-wrap gap-8 text-sm">
          <div>
            <p className="text-white/50">Dates</p>
            <p className="font-semibold">
              {formatDate(trip.start_date)} – {formatDate(trip.end_date)}
            </p>
          </div>
          {nights !== null && (
            <div>
              <p className="text-white/50">Duration</p>
              <p className="font-semibold">
                {nights} {nights === 1 ? "Night" : "Nights"}
              </p>
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
  );
}

// ─── Pending State ────────────────────────────────────────────────────────────
function PendingTripView({ trip }: { trip: Trip }) {
  const statusLabel = STATUS_LABELS[trip.status] ?? trip.status;
  const statusColor = STATUS_COLORS[trip.status] ?? "bg-gray-100 text-gray-600";

  return (
    <div className="max-w-7xl mx-auto px-6 mt-8 mb-16 space-y-6">
      <HeroCard trip={trip} statusLabel={statusLabel} statusColor={statusColor} />
      <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-between gap-6">
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">What happens next?</h3>
          <p className="text-sm text-gray-500">
            {trip.status === "draft"
              ? "Your trip isn't submitted yet. Continue chatting with our AI concierge to finalize your preferences."
              : "Our concierge team is crafting your personalized travel proposal. You'll receive a notification once your proposal is ready to review."}
          </p>
        </div>
        {trip.status === "draft" && (
          <Link
            href={`/concierge?trip_id=${trip.id}`}
            className="flex-shrink-0 px-6 py-2.5 bg-[#1E3D2F] text-white text-sm font-medium rounded-full hover:bg-[#2a5240] transition-colors"
          >
            Continue Planning
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Rich State ───────────────────────────────────────────────────────────────
function RichTripView({ trip }: { trip: TripDetail }) {
  const statusLabel = STATUS_LABELS[trip.status] ?? trip.status;
  const statusColor = STATUS_COLORS[trip.status] ?? "bg-gray-100 text-gray-600";

  const sortedPlans = [...(trip.travel_plans ?? [])].sort(
    (a, b) => a.sort - b.sort
  );
  const allItems: TravelPlanItem[] = sortedPlans.flatMap((p) => p.items);

  const firstFlight = allItems.find((i) => i.category_type === "flight");
  const firstHotel = allItems.find((i) => i.category_type === "staying");
  const activitiesCount = allItems.filter(
    (i) => i.category_type === "activities"
  ).length;

  const nights = getNights(trip.start_date, trip.end_date);

  return (
    <div className="max-w-7xl mx-auto px-6 mt-8 mb-16 space-y-8">
      {/* Hero */}
      <HeroCard trip={trip} statusLabel={statusLabel} statusColor={statusColor} />

      {/* Info Cards */}
      <div className="grid grid-cols-4 gap-5">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-2xl mb-3">✈️</div>
          <h3 className="font-semibold text-gray-900">Flight</h3>
          {firstFlight ? (
            <>
              <p className="text-sm text-gray-600 mt-1">{firstFlight.category_name}</p>
              {firstFlight.city && (
                <p className="text-xs text-gray-400 mt-1">{firstFlight.city}</p>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-400 mt-1">Not yet scheduled</p>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-2xl mb-3">🏨</div>
          <h3 className="font-semibold text-gray-900">Hotel</h3>
          {firstHotel ? (
            <>
              <p className="text-sm text-gray-600 mt-1">{firstHotel.category_name}</p>
              {firstHotel.city && (
                <p className="text-xs text-gray-400 mt-1">{firstHotel.city}</p>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-400 mt-1">Not yet assigned</p>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-2xl mb-3">🎯</div>
          <h3 className="font-semibold text-gray-900">Activities</h3>
          <p className="text-sm text-gray-600 mt-1">
            {activitiesCount} {activitiesCount === 1 ? "Activity" : "Activities"} Planned
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-2xl mb-3">📋</div>
          <h3 className="font-semibold text-gray-900">Booking</h3>
          <p className="text-sm text-gray-600 mt-1">{statusLabel}</p>
          <p className="text-xs text-gray-400 mt-1">Ref: TIP-{trip.id}</p>
        </div>
      </div>

      {/* Trip Timeline */}
      {sortedPlans.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-5">Trip Timeline</h2>
          <div className="space-y-4">
            {sortedPlans.map((plan, i) => (
              <div key={plan.id} className="flex gap-5 items-start">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-[#1E3D2F] text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
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
                    <span className="text-xs text-gray-400">
                      {formatDayDate(plan.date)}
                    </span>
                    {plan.day_topic && (
                      <span className="text-xs font-medium text-gray-700">
                        {plan.day_topic}
                      </span>
                    )}
                  </div>
                  {plan.items.length > 0 ? (
                    <div className="space-y-2">
                      {plan.items.map((item: TravelPlanItem) => (
                        <div key={item.id} className="flex items-start gap-3">
                          <span
                            className={`text-xs px-2 py-0.5 rounded font-medium flex-shrink-0 mt-0.5 ${
                              categoryColor[item.category_type ?? "others"] ??
                              "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {categoryLabel[item.category_type ?? "others"] ?? "Other"}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {item.category_name}
                            </p>
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
          </div>
        </div>
      )}

      {/* Trip Summary */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-5">Trip Summary</h2>
        <div className="grid grid-cols-4 gap-5">
          {nights !== null && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
              <p className="text-3xl font-bold text-[#1E3D2F]">{nights}</p>
              <p className="text-sm text-gray-500 mt-1">Nights</p>
            </div>
          )}
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
            <p className="text-3xl font-bold text-[#1E3D2F]">{sortedPlans.length}</p>
            <p className="text-sm text-gray-500 mt-1">Days</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
            <p className="text-3xl font-bold text-[#1E3D2F]">{activitiesCount}</p>
            <p className="text-sm text-gray-500 mt-1">Activities</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
            <p className="text-3xl font-bold text-[#1E3D2F]">
              {trip.adults + (trip.kids ?? 0)}
            </p>
            <p className="text-sm text-gray-500 mt-1">Travelers</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MyPageUpcomingTravels() {
  const [loading, setLoading] = useState(true);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [tripDetail, setTripDetail] = useState<TripDetail | null>(null);

  useEffect(() => {
    apiClient
      .getTrips({ exclude_canceled: true })
      .then(async (trips) => {
        const picked = pickActiveTrip(trips);
        setActiveTrip(picked);
        if (picked && HAS_PROPOSAL_STATUSES.has(picked.status)) {
          const detail = await apiClient.getTripById(picked.id);
          setTripDetail(detail);
        }
      })
      .catch(() => {
        // show empty state on error
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar activeLink="My Page" />
      <SubNav activeTab="Upcoming Travels" />

      {loading && <LoadingSkeleton />}

      {!loading && !activeTrip && <EmptyState />}

      {/* Pending: trip exists but no proposal yet (or detail fetch failed) */}
      {!loading && activeTrip && !tripDetail && (
        <PendingTripView trip={activeTrip} />
      )}

      {/* Rich: trip with full proposal and travel plans */}
      {!loading && tripDetail && <RichTripView trip={tripDetail} />}

      <Footer />
    </div>
  );
}
