'use client';

import Image from 'next/image';
import Link from 'next/link';
import DraftBadge from '@/components/DraftBadge';
import EntityRatingBadge from '@/components/reviews/EntityRatingBadge';
import { getImageUrl, getLocalizedText } from '@/types/common';
import type { Activity } from '@/types/activity';

interface ActivityCardProps {
  activity: Activity;
  cityName?: string;
}

function getActivityTag(activity: Activity): string {
  if (!activity.category) return 'ACTIVITY';
  return activity.category.toUpperCase();
}

// The old 'signature' variant (gold pill for kind=package cards) was removed
// in SMA-209: signature journeys now render via SignatureJourneyCard. The
// -standard testid suffix is kept so existing test selectors stay stable.
export default function ActivityCard({ activity, cityName }: ActivityCardProps) {
  return (
    <Link
      href={`/activity/${activity.slug}`}
      data-testid="activity-card-standard"
      className={`group overflow-hidden rounded-xl bg-white shadow-sm transition-all hover:shadow-lg ${
        activity.status === 'draft' ? 'ring-2 ring-amber-400' : ''
      }`}
    >
      <div className="relative h-56 overflow-hidden">
        <Image
          src={getImageUrl(activity.images?.[0])}
          alt={getLocalizedText(activity.name)}
          fill
          sizes="(max-width: 768px) 100vw, 25vw"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div
          data-testid="activity-pill-standard"
          className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold tracking-wider text-green-dark backdrop-blur-sm"
        >
          {getActivityTag(activity)}
        </div>
        <DraftBadge status={activity.status} />
      </div>
      <div className="p-5">
        <h3 className="font-primary text-[18px] font-semibold text-green-dark">
          {getLocalizedText(activity.name)}
        </h3>
        {cityName && <p className="mt-1 text-[13px] text-gray-text">{cityName}</p>}
        <EntityRatingBadge entityType="activity" entityId={activity.id} className="mt-2" />
      </div>
    </Link>
  );
}
