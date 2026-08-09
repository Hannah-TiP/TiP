'use client';

import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ProjectedTripEarn } from '@/types/stay-credit';

function formatAmount(amountCents: number, currency: string): string {
  const dollars = (amountCents / 100).toFixed(2);
  return `${currency} ${dollars}`;
}

// Pending earnings — projected review-gated credit (SMA-276). Estimates
// only: never added to the balance or mixed into the history. Loaded via
// next/dynamic from the credits page (code-split; client-fetched data).
export default function PendingEarningsSection({
  projections,
}: {
  projections: ProjectedTripEarn[];
}) {
  const { t } = useLanguage();

  if (projections.length === 0) return null;

  return (
    <div
      className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100 mb-10"
      data-testid="pending-earnings"
    >
      <h2 className="font-primary text-[26px] italic text-[#1E3D2F]">
        {t('credits.pending_title')}
      </h2>
      <p className="mt-2 text-[13px] text-gray-500">{t('credits.pending_subtitle')}</p>
      <div className="mt-6 divide-y divide-gray-100">
        {projections.map((projection) => {
          const amount = `~${formatAmount(projection.projected_amount_cents, projection.currency)}`;
          const awaitingReview = projection.blocking_reason === 'awaiting_review';
          return (
            <div
              key={projection.trip_id}
              className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="text-[14px] font-medium text-gray-900">
                  {projection.trip_title?.trim() ||
                    t('credits.pending_untitled_trip').replace('{id}', String(projection.trip_id))}
                </div>
                <div className="mt-0.5 text-[13px] text-gray-500">
                  {t(
                    awaitingReview
                      ? 'credits.pending_awaiting_review'
                      : 'credits.pending_trip_not_finished',
                  ).replace('{amount}', amount)}
                </div>
                <Link
                  href={
                    awaitingReview
                      ? `/my-page/travel-history/${projection.trip_id}/reviews`
                      : `/my-page/travel-history/${projection.trip_id}`
                  }
                  className="mt-1 inline-block text-[12px] font-medium text-[#C4956A] hover:underline"
                >
                  {t(
                    awaitingReview ? 'credits.pending_cta_review' : 'credits.pending_cta_view_trip',
                  )}
                </Link>
              </div>
              <div className="sm:text-right">
                <div className="font-primary text-[22px] italic text-[#C4956A]">{amount}</div>
                <span className="inline-block rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold text-[#C4956A]">
                  {t('credits.pending_estimated')}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
