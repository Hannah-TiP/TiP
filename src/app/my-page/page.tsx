'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import TopBar from '@/components/TopBar';
import SubNav from '@/components/SubNav';
import Footer from '@/components/Footer';
import { getTripsWithVersions, type TripWithVersion } from '@/lib/trip-utils';

const STATUS_PRIORITY = [
  'draft',
  'waiting-for-proposal',
  'in-progress',
  'waiting-for-payment',
  'paid',
  'ready-to-travel',
  'traveling-now',
] as const;

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

function sortByPriority(trips: TripWithVersion[]): TripWithVersion[] {
  return [...trips].sort((a, b) => {
    const ai = STATUS_PRIORITY.indexOf(a.trip.status as (typeof STATUS_PRIORITY)[number]);
    const bi = STATUS_PRIORITY.indexOf(b.trip.status as (typeof STATUS_PRIORITY)[number]);
    return bi - ai;
  });
}

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

function HeroCard({ item }: { item: TripWithVersion }) {
  const title = item.currentVersion?.title?.trim() || 'New Trip';
  const startDate = item.currentVersion?.start_date || undefined;
  const endDate = item.currentVersion?.end_date || undefined;
  const nights = getNights(startDate, endDate);
  const adults = item.currentVersion?.adults ?? 0;
  const kids = item.currentVersion?.kids ?? 0;
  const summary = item.currentVersion?.summary || undefined;
  const statusLabel = STATUS_LABELS[item.trip.status] ?? item.trip.status;
  const statusColor = STATUS_COLORS[item.trip.status] ?? 'bg-gray-100 text-gray-600';

  return (
    <Link href={`/my-page/trip/${item.trip.id}`} className="block group">
      <div className="bg-[#1E3D2F] rounded-2xl overflow-hidden flex group-hover:ring-2 group-hover:ring-[#C4956A] transition-all">
        <div className="w-[480px] flex-shrink-0 relative">
          <div className="w-full h-full min-h-[240px] bg-gradient-to-br from-[#2a5240] to-[#C4956A] flex items-center justify-center">
            <span className="text-white text-2xl font-bold px-6 text-center">{title}</span>
          </div>
        </div>
        <div className="flex-1 p-10 text-white flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <p className="text-sm uppercase tracking-widest text-white/60">Featured Trip</p>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColor}`}>
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
    </Link>
  );
}

function TripCard({ item }: { item: TripWithVersion }) {
  const title = item.currentVersion?.title?.trim() || 'New Trip';
  const startDate = item.currentVersion?.start_date || undefined;
  const endDate = item.currentVersion?.end_date || undefined;
  const nights = getNights(startDate, endDate);
  const adults = item.currentVersion?.adults ?? 0;
  const kids = item.currentVersion?.kids ?? 0;
  const summary = item.currentVersion?.summary || undefined;
  const statusLabel = STATUS_LABELS[item.trip.status] ?? item.trip.status;
  const statusColor = STATUS_COLORS[item.trip.status] ?? 'bg-gray-100 text-gray-600';

  return (
    <Link href={`/my-page/trip/${item.trip.id}`} className="block group">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-[#C4956A]/40 transition-all">
        <div className="h-36 relative">
          <div className="w-full h-full bg-gradient-to-br from-[#2a5240] to-[#C4956A]" />
          <span
            className={`absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor}`}
          >
            {statusLabel}
          </span>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-1 truncate">{title}</h3>
          <p className="text-sm text-gray-500">
            {formatDate(startDate)} – {formatDate(endDate)}
            {nights !== null && <span className="ml-2 text-gray-400">({nights}N)</span>}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {adults} {adults === 1 ? 'Adult' : 'Adults'}
            {kids ? `, ${kids} Kids` : ''}
            {summary && <span className="ml-1">· {summary}</span>}
          </p>
        </div>
      </div>
    </Link>
  );
}

export default function MyPageUpcomingTravels() {
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<TripWithVersion[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const loaded = await getTripsWithVersions({ exclude_canceled: true });
        const active = loaded.filter(
          ({ trip }) => trip.status !== 'travel-completed' && trip.status !== 'canceled',
        );
        setTrips(sortByPriority(active));
      } finally {
        setLoading(false);
      }
    };

    load();
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
          <HeroCard item={featured} />

          {otherTrips.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Other Active Trips</h2>
              <div className="grid grid-cols-3 gap-5">
                {otherTrips.map((item) => (
                  <TripCard key={item.trip.id} item={item} />
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
