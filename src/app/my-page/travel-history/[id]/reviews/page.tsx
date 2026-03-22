'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import TopBar from '@/components/TopBar';
import SubNav from '@/components/SubNav';
import Footer from '@/components/Footer';
import { apiClient } from '@/lib/api-client';
import type { TripDetail, TravelPlanItem, ReviewPayload } from '@/types/trip';
import Image from 'next/image';
import { getImageUrl } from '@/types/common';

// ─── Utilities ───────────────────────────────────────────────────────────────

function getDestination(trip: TripDetail): string {
  return trip.preset_destination_cities_names || trip.custom_destination_cities || 'Your Trip';
}

function getReviewableItems(trip: TripDetail): TravelPlanItem[] {
  const allItems = [...(trip.travel_plans ?? [])]
    .sort((a, b) => a.sort - b.sort)
    .flatMap((p) => p.items);

  return allItems.filter(
    (item) =>
      (item.category_type === 'staying' && item.system_hotel_id) ||
      (item.category_type === 'activities' && item.system_activity_id),
  );
}

const categoryLabel: Record<string, string> = {
  staying: 'Hotel',
  activities: 'Activity',
};

const categoryColor: Record<string, string> = {
  staying: 'bg-purple-100 text-purple-700',
  activities: 'bg-green-100 text-green-700',
};

const reviewStatusLabel: Record<string, string> = {
  none: '',
  'pending-review': 'Pending Review',
  published: 'Published',
  rejected: 'Rejected',
};

const reviewStatusColor: Record<string, string> = {
  'pending-review': 'bg-yellow-100 text-yellow-700',
  published: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

// ─── Star Rating ─────────────────────────────────────────────────────────────

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="text-2xl transition-colors focus:outline-none"
        >
          <span className={star <= (hover || value) ? 'text-yellow-400' : 'text-gray-300'}>★</span>
        </button>
      ))}
    </div>
  );
}

// ─── Single Review Card ──────────────────────────────────────────────────────

function ReviewCard({ item }: { item: TravelPlanItem }) {
  const [score, setScore] = useState(0);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const alreadyReviewed = item.user_review_status && item.user_review_status !== 'none';

  const handleSubmit = async () => {
    if (score === 0) {
      setError('Please select a rating.');
      return;
    }
    if (!content.trim()) {
      setError('Please write a review.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const payload: ReviewPayload = {
        rating: score,
        review_content: content.trim(),
      };
      await apiClient.createReview(item.id, payload);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <span
          className={`text-xs px-2 py-0.5 rounded font-medium ${
            categoryColor[item.category_type ?? ''] ?? 'bg-gray-100 text-gray-600'
          }`}
        >
          {categoryLabel[item.category_type ?? ''] ?? 'Other'}
        </span>
        <h3 className="font-semibold text-gray-900">{item.category_name}</h3>
        {item.city && <span className="text-xs text-gray-400">{item.city}</span>}
        {alreadyReviewed && (
          <span
            className={`ml-auto text-xs font-medium px-2 py-0.5 rounded ${
              reviewStatusColor[item.user_review_status!] ?? 'bg-gray-100 text-gray-600'
            }`}
          >
            {reviewStatusLabel[item.user_review_status!] ?? item.user_review_status}
          </span>
        )}
      </div>

      {submitted ? (
        <div className="text-center py-6">
          <p className="text-green-600 font-medium">Review submitted! Thank you.</p>
        </div>
      ) : alreadyReviewed ? (
        <div className="text-sm text-gray-500">
          You&apos;ve already reviewed this item.
          {item.user_rating && <span className="ml-2">Your rating: {item.user_rating}/5 ★</span>}
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Rating</label>
            <StarRating value={score} onChange={setScore} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Your Review</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your experience..."
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3D2F]/20 focus:border-[#1E3D2F] resize-none"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2.5 bg-[#1E3D2F] text-white text-sm font-medium rounded-lg hover:bg-[#2a5240] transition-colors disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReviewsPage() {
  const { id } = useParams<{ id: string }>();
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    apiClient
      .getTripById(Number(id))
      .then(setTrip)
      .catch(() => setError('Failed to load trip details.'))
      .finally(() => setLoading(false));
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

  if (error || !trip) {
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

  const destination = getDestination(trip);
  const reviewableItems = getReviewableItems(trip);

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar activeLink="My Page" />
      <SubNav activeTab="Travel History" />

      <div className="max-w-4xl mx-auto px-6 mt-8 mb-16">
        {/* Back */}
        <Link
          href={`/my-page/travel-history/${trip.id}`}
          className="text-sm text-gray-500 hover:text-gray-900 mb-6 inline-block"
        >
          ← Back to Trip
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            {trip.cover_image && (
              <Image
                src={getImageUrl(trip.cover_image)}
                alt={destination}
                className="w-16 h-16 rounded-xl object-cover"
                width={64}
                height={64}
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Review Your Experience</h1>
              <p className="text-gray-500">{destination}</p>
            </div>
          </div>
        </div>

        {/* Reviewable items */}
        {reviewableItems.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
            No items available for review.
          </div>
        ) : (
          <div className="space-y-5">
            {reviewableItems.map((item) => (
              <ReviewCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
