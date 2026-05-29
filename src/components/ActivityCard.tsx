'use client';

import Image from 'next/image';
import Link from 'next/link';
import DraftBadge from '@/components/DraftBadge';
import EntityRatingBadge from '@/components/reviews/EntityRatingBadge';
import { getImageUrl, getLocalizedText } from '@/types/common';
import type { Activity } from '@/types/activity';

export type ActivityCardVariant = 'standard' | 'signature';

interface ActivityCardProps {
  activity: Activity;
  variant: ActivityCardVariant;
  cityName?: string;
}

function getActivityTag(activity: Activity, variant: ActivityCardVariant): string {
  if (variant === 'signature') return 'SIGNATURE JOURNEY';
  if (!activity.category) return 'ACTIVITY';
  return activity.category.toUpperCase();
}

export default function ActivityCard({ activity, variant, cityName }: ActivityCardProps) {
  // Gold accent on the category pill for premium "Signature Journey" cards.
  const pillClassName =
    variant === 'signature'
      ? 'absolute left-3 top-3 rounded-full bg-gold px-3 py-1 text-[10px] font-semibold tracking-wider text-white backdrop-blur-sm'
      : 'absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold tracking-wider text-green-dark backdrop-blur-sm';

  return (
    <Link
      href={`/activity/${activity.slug}`}
      data-testid={`activity-card-${variant}`}
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
        <div data-testid={`activity-pill-${variant}`} className={pillClassName}>
          {getActivityTag(activity, variant)}
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
