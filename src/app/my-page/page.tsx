'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import TopBar from '@/components/TopBar';
import SubNav from '@/components/SubNav';
import Footer from '@/components/Footer';
import { apiClient } from '@/lib/api-client';
import type { Trip } from '@/types/trip';
import Image from 'next/image';
import { getImageUrl } from '@/types/common';

const STATUS_PRIORITY = [
  'draft',
  'waiting-for-proposal',
  'in-progress',
  'waiting-for-payment',
  'paid',
  'ready-to-travel',
  'traveling-now',
];

const STATUS_LABELS: Record<string, string> = {
  draft: 'Planning',
  'waiting-for-proposal': 'Awaiting Proposal',
  'in-progress': 'In Progress',
  'waiting-for-payment': 'Awaiting Payment',
  paid: 'Payment Confirmed',
  'ready-to-travel': 'Ready to Travel',
  'traveling-now': 'Traveling Now',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  'waiting-for-proposal': 'bg-yellow-100 text-yellow-700',
  'in-progress': 'bg-blue-100 text-blue-700',
  'waiting-for-payment': 'bg-orange-100 text-orange-700',
  paid: 'bg-teal-100 text-teal-700',
  'ready-to-travel': 'bg-green-100 text-green-700',
  'traveling-now': 'bg-emerald-100 text-emerald-700',
};

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

function getDestination(trip: Trip): string {
  return trip.preset_destination_cities_names || trip.custom_destination_cities || 'Your Trip';
}

function sortByPriority(trips: Trip[]): Trip[] {
  return [...trips].sort((a, b) => {
    const ai = STATUS_PRIORITY.indexOf(a.status);
    const bi = STATUS_PRIORITY.indexOf(b.status);
    return bi - ai;
  });
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-6 mt-8 mb-16 space-y-8 animate-pulse">
      <div className="h-56 bg-gray-200 rounded-2xl" />
      <div className="grid grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 bg-gray-200 rounded-xl" />
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
        <p className="text-gray-500 mb-8">Let our AI concierge craft your perfect journey.</p>
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

// ─── Hero Card (featured trip) ───────────────────────────────────────────────
function HeroCard({ trip }: { trip: Trip }) {
  const destination = getDestination(trip);
  const nights = getNights(trip.start_date, trip.end_date);
  const statusLabel = STATUS_LABELS[trip.status] ?? trip.status;
  const statusColor = STATUS_COLORS[trip.status] ?? 'bg-gray-100 text-gray-600';

  return (
    <Link href={`/my-page/trip/${trip.id}`} className="block group">
      <div className="bg-[#1E3D2F] rounded-2xl overflow-hidden flex group-hover:ring-2 group-hover:ring-[#C4956A] transition-all">
        <div className="w-[480px] flex-shrink-0 relative">
          {trip.cover_image ? (
            <Image
              src={getImageUrl(trip.cover_image)}
              alt={destination}
              className="object-cover"
              fill
              sizes="480px"
            />
          ) : (
            <div className="w-full h-full min-h-[240px] bg-gradient-to-br from-[#2a5240] to-[#C4956A] flex items-center justify-center">
              <span className="text-white text-2xl font-bold px-6 text-center">{destination}</span>
            </div>
          )}
        </div>
        <div className="flex-1 p-10 text-white flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <p className="text-sm uppercase tracking-widest text-white/60">Featured Trip</p>
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
                  {nights} {nights === 1 ? 'Night' : 'Nights'}
                </p>
              </div>
            )}
            <div>
              <p className="text-white/50">Travelers</p>
              <p className="font-semibold">
                {trip.adults} {trip.adults === 1 ? 'Adult' : 'Adults'}
                {trip.kids ? `, ${trip.kids} ${trip.kids === 1 ? 'Kid' : 'Kids'}` : ''}
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
    </Link>
  );
}

// ─── Trip Card (grid item) ───────────────────────────────────────────────────
function TripCard({ trip }: { trip: Trip }) {
  const destination = getDestination(trip);
  const nights = getNights(trip.start_date, trip.end_date);
  const statusLabel = STATUS_LABELS[trip.status] ?? trip.status;
  const statusColor = STATUS_COLORS[trip.status] ?? 'bg-gray-100 text-gray-600';

  return (
    <Link href={`/my-page/trip/${trip.id}`} className="block group">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-[#C4956A]/40 transition-all">
        <div className="h-36 relative">
          {trip.cover_image ? (
            <Image
              src={getImageUrl(trip.cover_image)}
              alt={destination}
              className="object-cover"
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#2a5240] to-[#C4956A]" />
          )}
          <span
            className={`absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor}`}
          >
            {statusLabel}
          </span>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-1 truncate">{destination}</h3>
          <p className="text-sm text-gray-500">
            {formatDate(trip.start_date)} – {formatDate(trip.end_date)}
            {nights !== null && <span className="ml-2 text-gray-400">({nights}N)</span>}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {trip.adults} {trip.adults === 1 ? 'Adult' : 'Adults'}
            {trip.kids ? `, ${trip.kids} Kids` : ''}
            {trip.purpose && <span className="ml-1 capitalize">· {trip.purpose}</span>}
          </p>
        </div>
      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MyPageUpcomingTravels() {
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<Trip[]>([]);

  useEffect(() => {
    apiClient
      .getTrips({ exclude_canceled: true })
      .then((allTrips) => {
        const active = allTrips.filter(
          (t) => t.status !== 'travel-completed' && t.status !== 'canceled',
        );
        setTrips(sortByPriority(active));
      })
      .catch(() => {
        // show empty state on error
      })
      .finally(() => setLoading(false));
  }, []);

  const featured = trips[0] ?? null;
  const otherTrips = trips.slice(1);

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar activeLink="My Page" />
      <SubNav activeTab="Upcoming Travels" />

      {loading && <LoadingSkeleton />}

      {!loading && trips.length === 0 && <EmptyState />}

      {!loading && featured && (
        <div className="max-w-7xl mx-auto px-6 mt-8 mb-16 space-y-8">
          <HeroCard trip={featured} />

          {otherTrips.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Other Active Trips</h2>
              <div className="grid grid-cols-3 gap-5">
                {otherTrips.map((trip) => (
                  <TripCard key={trip.id} trip={trip} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Footer />
    </div>
  );
}
