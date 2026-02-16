"use client";

import type { Trip } from '@/types/ai-chat';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface TripCardProps {
  trip: Trip;
}

const statusColors = {
  'draft': 'bg-gray-200 text-gray-700',
  'waiting-for-proposal': 'bg-yellow-100 text-yellow-800',
  'paid': 'bg-green-100 text-green-800',
  'completed': 'bg-blue-100 text-blue-800',
};

const statusLabels = {
  'draft': 'Draft',
  'waiting-for-proposal': 'Pending',
  'paid': 'Paid',
  'completed': 'Completed',
};

export default function TripCard({ trip }: TripCardProps) {
  const router = useRouter();

  const handleClick = () => {
    // Navigate to trip details page if it exists
    // For now, just log the trip ID
    console.log('Trip clicked:', trip.id);
    // router.push(`/trips/${trip.id}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-shadow cursor-pointer"
    >
      {/* Cover Image */}
      <div className="relative w-full h-[140px]">
        {trip.cover_image ? (
          <Image
            src={trip.cover_image}
            alt={trip.destination}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#1E3D2F] to-[#C4956A] flex items-center justify-center">
            <span className="font-cormorant text-2xl text-white">{trip.destination}</span>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-3 py-1 rounded-full text-xs font-inter font-medium ${statusColors[trip.status]}`}>
            {statusLabels[trip.status]}
          </span>
        </div>
      </div>

      {/* Trip Info */}
      <div className="p-4">
        <h4 className="font-inter text-base font-semibold text-[#1E3D2F] mb-2">
          {trip.destination}
        </h4>

        <div className="space-y-1 text-sm font-inter text-gray-600">
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>
              {formatDate(trip.start_date)} – {formatDate(trip.end_date)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>
              {trip.adults} {trip.adults === 1 ? 'Adult' : 'Adults'}
              {trip.kids ? `, ${trip.kids} ${trip.kids === 1 ? 'Kid' : 'Kids'}` : ''}
            </span>
          </div>

          {trip.purpose && (
            <div className="mt-2">
              <span className="inline-block px-2 py-1 bg-gray-100 rounded text-xs text-gray-700">
                {trip.purpose}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
