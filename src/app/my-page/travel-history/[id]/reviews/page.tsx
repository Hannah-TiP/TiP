'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import TopBar from '@/components/TopBar';
import SubNav from '@/components/SubNav';
import Footer from '@/components/Footer';
import type { TripPlanItem } from '@/types/trip';
import { getTripReviewableItems, getTripWithVersion, type TripWithVersion } from '@/lib/trip-utils';

const categoryLabel: Record<'hotel' | 'activity', string> = {
  hotel: 'Hotel',
  activity: 'Activity',
};

const categoryColor: Record<'hotel' | 'activity', string> = {
  hotel: 'bg-purple-100 text-purple-700',
  activity: 'bg-green-100 text-green-700',
};

function ReviewCard({ item }: { item: TripPlanItem }) {
  const category = item.item_type === 'hotel' ? 'hotel' : 'activity';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className={`text-xs px-2 py-0.5 rounded font-medium ${categoryColor[category]}`}>
          {categoryLabel[category]}
        </span>
        <h3 className="font-semibold text-gray-900">{item.title || categoryLabel[category]}</h3>
      </div>
      <p className="text-sm text-gray-500">
        Review submission for v2 itinerary items is not wired yet. This page will come back once the
        v2 review flow is migrated.
      </p>
    </div>
  );
}

export default function ReviewsPage() {
  const { id } = useParams<{ id: string }>();
  const [tripWithVersion, setTripWithVersion] = useState<TripWithVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        setTripWithVersion(await getTripWithVersion(Number(id)));
      } catch {
        setError('Failed to load trip details.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopBar activeLink="My Page" />
        <SubNav activeTab="Travel History" />
        <div className="max-w-4xl mx-auto px-6 mt-8 space-y-4 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !tripWithVersion) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopBar activeLink="My Page" />
        <SubNav activeTab="Travel History" />
        <div className="max-w-4xl mx-auto px-6 mt-8 text-center py-20 text-gray-500">
          <p>{error ?? 'Trip not found.'}</p>
          <Link
            href="/my-page"
            className="mt-4 inline-block text-[#1E3D2F] hover:underline text-sm"
          >
            ← Back to My Trips
          </Link>
        </div>
      </div>
    );
  }

  const { trip, currentVersion } = tripWithVersion;
  const destination = currentVersion?.title?.trim() || 'New Trip';
  const reviewableItems = getTripReviewableItems(currentVersion);

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar activeLink="My Page" />
      <SubNav activeTab="Travel History" />

      <div className="max-w-4xl mx-auto px-6 mt-8 mb-16">
        <Link
          href={`/my-page/travel-history/${trip.id}`}
          className="text-sm text-gray-500 hover:text-gray-900 mb-6 inline-block"
        >
          ← Back to Trip
        </Link>

        <div className="mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Review Your Experience</h1>
            <p className="text-gray-500">{destination}</p>
          </div>
        </div>

        {reviewableItems.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500">
              There are no reviewable v2 itinerary items yet, or the v2 review flow has not been
              migrated for this trip.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {reviewableItems.map((item, index) => (
              <ReviewCard key={`${item.item_type}-${index}`} item={item} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
