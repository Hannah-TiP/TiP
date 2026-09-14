'use client';

import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  formatPoints,
  formatSignedPoints,
  pointsToUsdApprox,
  projectedPoints,
} from '@/lib/points-wallet';
import { isAwaitingCompletion, type ProjectedTripEarn } from '@/types/stay-credit';

// Pending earnings — projected post-trip TiP Points (SMA-276; P-denominated
// since SMA-358). Estimates only: never added to the balance or mixed into
// the history. Points accrue automatically on the completion pass once the
// trip is date-finished (SMA-327) — reviews are a SEPARATE reward. Loaded via
// next/dynamic from the credits page (code-split; client-fetched data).
export default function PendingEarningsSection({
  projections,
  pointUnit,
}: {
  projections: ProjectedTripEarn[];
  // Registry `point_unit` (points per 1 USD) — null hides the USD line and
  // the legacy cents→points fallback.
  pointUnit: number | null;
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
          const points = projectedPoints(projection, pointUnit);
          const usdApprox = points === null ? null : pointsToUsdApprox(points, pointUnit);
          const awaitingCompletion = isAwaitingCompletion(projection.blocking_reason);
          const copy =
            points === null
              ? t(
                  awaitingCompletion
                    ? 'credits.pending_awaiting_completion_no_figure'
                    : 'credits.pending_trip_not_finished_no_figure',
                )
              : t(
                  awaitingCompletion
                    ? 'credits.pending_awaiting_completion'
                    : 'credits.pending_trip_not_finished',
                ).replace('{points}', formatPoints(points));
          return (
            <div
              key={projection.trip_id}
              className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between"
              data-testid="pending-earning-row"
            >
              <div>
                <div className="text-[14px] font-medium text-gray-900">
                  {projection.trip_title?.trim() ||
                    t('credits.pending_untitled_trip').replace('{id}', String(projection.trip_id))}
                </div>
                <div className="mt-0.5 text-[13px] text-gray-500">{copy}</div>
                {awaitingCompletion && (
                  <div className="mt-1 text-[12px] text-gray-500">
                    {t('credits.pending_review_separate')}{' '}
                    <Link
                      href={`/my-page/travel-history/${projection.trip_id}/reviews`}
                      className="font-medium text-[#C4956A] hover:underline"
                    >
                      {t('credits.pending_cta_review')}
                    </Link>
                  </div>
                )}
                <Link
                  href={`/my-page/travel-history/${projection.trip_id}`}
                  className="mt-1 inline-block text-[12px] font-medium text-[#C4956A] hover:underline"
                >
                  {t('credits.pending_cta_view_trip')}
                </Link>
              </div>
              <div className="sm:text-right">
                {points !== null && (
                  <div
                    className="font-primary text-[22px] italic text-[#C4956A]"
                    data-testid="pending-points"
                  >
                    {formatSignedPoints(points)}
                  </div>
                )}
                {usdApprox !== null && (
                  <div className="text-[12px] text-gray-500" data-testid="pending-usd-approx">
                    {t('credits.usd_approx').replace('{amount}', usdApprox.toLocaleString('en-US'))}
                  </div>
                )}
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
