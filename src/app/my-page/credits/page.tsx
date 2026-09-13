'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Footer from '@/components/Footer';
import RedeemCodeSection from '@/components/credits/RedeemCodeSection';
import { useLanguage, type Lang } from '@/contexts/LanguageContext';
import { useBenefits } from '@/hooks/useBenefits';
import { resolvePointUnit } from '@/lib/benefits';
import { formatDate as formatDateI18n } from '@/lib/format-date';
import { apiClient } from '@/lib/api-client';
import { formatPoints, formatSignedPoints, pointsToUsdApprox } from '@/lib/points-wallet';
import {
  creditSourceLabel,
  isPointsConsumption,
  pointKindText,
  pointSourceText,
  tripIdFromCredit,
  type PointTransaction,
  type ProjectedTripEarn,
} from '@/types/stay-credit';

// Code-split (bundle-size gate): the section only loads when the member
// actually has pending projections, and its data is client-fetched anyway.
const PendingEarningsSection = dynamic(
  () => import('@/components/credits/PendingEarningsSection'),
  {
    ssr: false,
  },
);

function formatDate(iso: string | null | undefined, lang: Lang): string {
  if (!iso) return '—';
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return '—';
  return formatDateI18n(ms, lang, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

const COLUMN_LABEL_CLASS = 'text-[10px] uppercase tracking-wider text-gray-400';

export default function MyCreditsPage() {
  const { status } = useSession();
  const router = useRouter();
  const { lang, t } = useLanguage();
  const en = lang === 'en';
  // Registry copy for source labels + the `point_unit` (points per USD)
  // behind the USD approximation (SMA-322 / SMA-332); null degrades to the
  // static fallback labels and hides the USD line.
  const benefits = useBenefits();

  const [loading, setLoading] = useState(true);
  const [balancePoints, setBalancePoints] = useState(0);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [projections, setProjections] = useState<ProjectedTripEarn[]>([]);
  // null = no error; '' = failed with no server message (localized fallback
  // is resolved at render time so this callback never depends on `t`).
  const [error, setError] = useState<string | null>(null);

  const loadPoints = useCallback(() => {
    return apiClient
      .getMyPoints()
      .then((ledger) => {
        // The balance is the backend-derived SUM(delta_points) — never
        // re-summed from the rows on the FE.
        setBalancePoints(ledger.balance_points);
        setTransactions(ledger.transactions);
        setError(null);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message ?? '');
        setLoading(false);
      });
  }, []);

  const loadProjection = useCallback(() => {
    // Estimates only — a projection failure must never break the page, so
    // degrade by hiding the section.
    return apiClient
      .getMyCreditProjection()
      .then((res) => setProjections(res.projections))
      .catch(() => setProjections([]));
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/sign-in');
      return;
    }
    if (status !== 'authenticated') return;
    // Fired in parallel — neither fetch blocks the other.
    loadPoints();
    loadProjection();
  }, [status, router, loadPoints, loadProjection]);

  // Display-only, derived once per render from the registry unit. Null when
  // the registry is unavailable — the line is hidden rather than guessed.
  const usdApprox = pointsToUsdApprox(balancePoints, resolvePointUnit(benefits));

  return (
    <>
      <main className="min-h-[80vh] bg-[#FAF9F7]">
        <section className="max-w-5xl mx-auto px-4 md:px-6 py-16">
          <div className="text-center mb-10">
            <span className="text-[11px] font-semibold tracking-[4px] text-[#C4956A]">
              {t('credits.eyebrow')}
            </span>
            <h1 className="mt-3 font-primary text-[42px] italic leading-tight text-[#1E3D2F] md:text-[52px]">
              {t('credits.title')}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-gray-600">
              {t('credits.intro')}
            </p>
          </div>

          {/* Wallet balance card */}
          <div
            className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100 mb-10"
            data-testid="points-balance-card"
          >
            <div className="text-[11px] uppercase tracking-[3px] text-[#C4956A]">
              {t('credits.balance_label')}
            </div>
            <div
              className="mt-3 font-primary text-[40px] italic text-[#1E3D2F]"
              data-testid="points-balance"
            >
              {formatPoints(balancePoints)}
            </div>
            {usdApprox !== null && (
              <div className="mt-1 text-[15px] text-gray-600" data-testid="points-usd-approx">
                {t('credits.usd_approx').replace('{amount}', usdApprox.toLocaleString('en-US'))}
              </div>
            )}
            <div className="mt-2 text-[13px] text-gray-500">{t('credits.balance_note')}</div>
          </div>

          {/* Pending earnings — projected review-gated credit (SMA-276).
              Estimates only: never added to the balance or mixed into the
              history. Hidden (chunk never loaded) when there are none. */}
          {projections.length > 0 && <PendingEarningsSection projections={projections} />}

          {/* Redeem a code */}
          <RedeemCodeSection onRedeemed={loadPoints} />

          {/* History */}
          <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
            <h2 className="font-primary text-[26px] italic text-[#1E3D2F]">
              {t('credits.history_title')}
            </h2>

            {loading ? (
              <div className="mt-6 text-center text-gray-500 text-sm">{t('credits.loading')}</div>
            ) : error !== null ? (
              <div className="mt-6 text-center text-rose-600 text-sm">
                {error || t('credits.error_load')}
              </div>
            ) : transactions.length === 0 ? (
              <div className="mt-6 text-center text-gray-500 text-sm" data-testid="points-empty">
                {t('credits.empty')}
              </div>
            ) : (
              <div className="mt-6" data-testid="points-history">
                <div
                  className={`hidden sm:grid sm:grid-cols-12 sm:gap-4 border-b border-gray-100 pb-3 ${COLUMN_LABEL_CLASS}`}
                >
                  <div className="sm:col-span-6">{t('credits.col_reason')}</div>
                  <div className="sm:col-span-2 sm:text-right">{t('credits.col_points')}</div>
                  <div className="sm:col-span-2">{t('credits.col_earned')}</div>
                  <div className="sm:col-span-2">{t('credits.col_expires')}</div>
                </div>
                <div className="divide-y divide-gray-100">
                  {transactions.map((row) => {
                    const linkedTripId = tripIdFromCredit(row);
                    const consumption = isPointsConsumption(row.kind);
                    const kindLabel =
                      row.kind && row.kind !== 'grant' ? pointKindText(row.kind, en) : null;
                    const delta = row.delta_points ?? null;
                    return (
                      <div
                        key={row.id}
                        className="py-5 flex flex-col gap-2 sm:grid sm:grid-cols-12 sm:gap-4 sm:items-center"
                        data-testid="points-row"
                      >
                        <div className="sm:col-span-6 text-[14px]">
                          <div
                            className="font-medium text-gray-900"
                            aria-label={creditSourceLabel(row, en, benefits)}
                          >
                            {pointSourceText(row.source, en, benefits)}
                            {row.promo_code ? (
                              <span className="text-gray-500"> · {row.promo_code}</span>
                            ) : null}
                          </div>
                          {kindLabel && (
                            <div className="text-[12px] text-gray-500" data-testid="points-kind">
                              {kindLabel}
                            </div>
                          )}
                          {row.notes && (
                            <div
                              className="text-[12px] text-gray-500 sm:truncate"
                              title={row.notes}
                            >
                              {row.notes}
                            </div>
                          )}
                          {linkedTripId !== null && (
                            <Link
                              href={`/my-page/travel-history/${linkedTripId}`}
                              className="mt-1 inline-block text-[12px] font-medium text-[#C4956A] hover:underline"
                            >
                              {t('credits.view_trip')}
                            </Link>
                          )}
                        </div>
                        <div
                          className={`sm:col-span-2 sm:text-right font-primary text-[22px] italic ${
                            delta !== null && delta < 0 ? 'text-gray-500' : 'text-[#1E3D2F]'
                          }`}
                          data-testid="points-delta"
                        >
                          {formatSignedPoints(delta)}
                        </div>
                        <div className="sm:col-span-2 text-[12px] text-gray-500">
                          <span className={`block sm:hidden ${COLUMN_LABEL_CLASS}`}>
                            {t('credits.col_earned')}
                          </span>
                          {formatDate(row.created_at, lang)}
                        </div>
                        <div
                          className="sm:col-span-2 text-[12px] text-gray-500"
                          data-testid="points-expiry"
                        >
                          <span className={`block sm:hidden ${COLUMN_LABEL_CLASS}`}>
                            {t('credits.col_expires')}
                          </span>
                          {consumption ? (
                            <span className="italic text-gray-400">{t('credits.expiry_na')}</span>
                          ) : row.expires_at ? (
                            formatDate(row.expires_at, lang)
                          ) : (
                            <span className="italic text-gray-400">{t('credits.expiry_none')}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <p className="mt-10 text-center text-[12px] text-gray-500">{t('credits.footnote')}</p>
        </section>
      </main>
      <Footer />
    </>
  );
}
