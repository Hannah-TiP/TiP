'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Footer from '@/components/Footer';
import { apiClient } from '@/lib/api-client';
import { formatCurrency } from '@/lib/format-currency';
import { tripDayNumber } from '@/lib/trip-utils';
import {
  appliedStayCreditAmount,
  isZeroTotal,
  type QuoteLineItem,
  type QuoteStatus,
  type QuoteWithVersion,
  type QuoteVersion,
} from '@/types/quote';
import type { Trip, TripVersion } from '@/types/trip';
import type { EligibleCredit } from '@/types/stay-credit';
import { useLanguage, type Lang } from '@/contexts/LanguageContext';
import { formatDate as formatDateI18n } from '@/lib/format-date';

// Return-URL polling: backend confirms payment via Flywire webhook, which
// races with the user's browser redirect from Flywire. We poll until the
// quote flips to PAID or until we hit the timeout below.
const POLL_INTERVAL_MS = 2_000;
const POLL_MAX_ATTEMPTS = 15; // ~30s total
type ToastTone = 'info' | 'warning' | 'error';
interface ToastMessage {
  id: number;
  text: string;
  tone: ToastTone;
}

const STATUS_LABEL_KEYS: Record<QuoteStatus, Parameters<ReturnType<typeof useLanguage>['t']>[0]> = {
  DRAFT: 'quote.status_draft',
  SENT: 'quote.status_sent',
  PAID: 'quote.status_paid',
  REJECTED: 'quote.status_rejected',
  EXPIRED: 'quote.status_expired',
};

const STATUS_BADGE_CLASSES: Record<QuoteStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  SENT: 'bg-amber-100 text-amber-700',
  PAID: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-gray-200 text-gray-500',
};

function formatDate(dateStr: string | null | undefined, lang: Lang): string {
  if (!dateStr) return '—';
  return formatDateI18n(dateStr, lang, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function groupByDay(items: QuoteLineItem[]): Map<number, QuoteLineItem[]> {
  const out = new Map<number, QuoteLineItem[]>();
  const sorted = [...items].sort((a, b) => {
    if (a.day_index !== b.day_index) return a.day_index - b.day_index;
    return a.item_index - b.item_index;
  });
  for (const item of sorted) {
    const list = out.get(item.day_index) ?? [];
    list.push(item);
    out.set(item.day_index, list);
  }
  return out;
}

function StatusBadge({ status }: { status: QuoteStatus }) {
  const { t } = useLanguage();
  return (
    <span
      className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_BADGE_CLASSES[status]}`}
    >
      {t(STATUS_LABEL_KEYS[status])}
    </span>
  );
}

function HeroCard({
  trip,
  tripVersion,
  status,
  expiresAt,
  paidAt,
}: {
  trip: Trip | null;
  tripVersion: TripVersion | null;
  status: QuoteStatus;
  expiresAt?: string | null;
  paidAt?: string | null;
}) {
  const { t, lang } = useLanguage();
  const title = tripVersion?.title?.trim() || t('quote.your_trip');
  const startDate = tripVersion?.start_date || undefined;
  const endDate = tripVersion?.end_date || undefined;
  const showExpiry = status === 'SENT' && !!expiresAt;
  const showPaid = status === 'PAID' && !!paidAt;

  return (
    <div className="bg-[#1E3D2F] rounded-2xl overflow-hidden flex flex-col md:flex-row">
      <div className="w-full md:w-[420px] md:flex-shrink-0 relative">
        <div className="w-full h-full min-h-[180px] md:min-h-[220px] bg-gradient-to-br from-[#2a5240] to-[#C4956A] flex items-center justify-center">
          <span className="text-white text-xl md:text-2xl font-bold px-6 text-center">{title}</span>
        </div>
      </div>
      <div className="flex-1 p-6 md:p-10 text-white flex flex-col justify-center">
        <div className="flex items-center gap-3 mb-2">
          <p className="text-sm uppercase tracking-widest text-white/60">{t('quote.label')}</p>
          <StatusBadge status={status} />
        </div>
        <h1 className="text-2xl md:text-4xl font-bold mb-4 break-words">{title}</h1>
        <div className="flex flex-wrap gap-4 md:gap-8 text-sm">
          <div>
            <p className="text-white/50">{t('quote.dates')}</p>
            <p className="font-semibold">
              {formatDate(startDate, lang)} – {formatDate(endDate, lang)}
            </p>
          </div>
          {showExpiry && (
            <div>
              <p className="text-white/50">{t('quote.valid_until')}</p>
              <p className="font-semibold">{formatDate(expiresAt, lang)}</p>
            </div>
          )}
          {showPaid && (
            <div>
              <p className="text-white/50">{t('quote.paid_on')}</p>
              <p className="font-semibold">{formatDate(paidAt, lang)}</p>
            </div>
          )}
          {trip?.id !== undefined && (
            <div>
              <p className="text-white/50">{t('quote.trip')}</p>
              <Link
                href={`/my-page/trip/${trip.id}`}
                className="font-semibold underline hover:text-white/80"
              >
                #{trip.id}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PayNowButton({
  quoteId,
  zeroTotal,
  onError,
  onPaid,
}: {
  quoteId: number;
  zeroTotal: boolean;
  onError: (msg: string) => void;
  onPaid: (bundle: QuoteWithVersion) => void;
}) {
  const { t } = useLanguage();
  const [submitting, setSubmitting] = useState(false);

  const handleClick = async () => {
    if (submitting) return;
    setSubmitting(true);
    if (zeroTotal) {
      // Nothing is owed (credits cover the full total) — the backend
      // refuses a Flywire checkout for a $0 quote, so this click marks
      // the quote PAID directly (SMA-237).
      try {
        const bundle = await apiClient.completeZeroTotalQuote(quoteId);
        onPaid(bundle);
      } catch (err) {
        const msg = err instanceof Error ? err.message : t('quote.error_complete_zero_total');
        onError(msg);
      } finally {
        setSubmitting(false);
      }
      return;
    }
    try {
      const result = await apiClient.createCheckoutSession(quoteId);
      // Hand off to Flywire's hosted checkout (or our /checkout/flywire wrapper).
      window.location.assign(result.checkout_url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('quote.error_start_checkout');
      onError(msg);
      setSubmitting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={submitting}
      data-testid="pay-now-button"
      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1E3D2F] text-white text-sm font-semibold rounded-full hover:bg-[#2a5240] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
    >
      {submitting ? (
        <>
          <span
            className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"
            aria-hidden
          />
          <span>{zeroTotal ? t('quote.completing_payment') : t('quote.starting_checkout')}</span>
        </>
      ) : (
        <span>{t('quote.pay_now')}</span>
      )}
    </button>
  );
}

function ConfirmingBanner() {
  const { t } = useLanguage();
  return (
    <div
      data-testid="confirming-payment-banner"
      className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 flex items-center gap-3"
    >
      <span
        className="inline-block w-4 h-4 border-2 border-amber-300 border-t-amber-700 rounded-full animate-spin"
        aria-hidden
      />
      <div>
        <p className="text-sm font-semibold text-amber-800">{t('quote.confirming_payment')}</p>
        <p className="text-xs text-amber-700/80">{t('quote.confirming_payment_body')}</p>
      </div>
    </div>
  );
}

function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
}) {
  const { t } = useLanguage();
  if (toasts.length === 0) return null;
  const toneClasses: Record<ToastTone, string> = {
    info: 'bg-gray-900 text-white',
    warning: 'bg-amber-100 text-amber-900 border border-amber-300',
    error: 'bg-red-100 text-red-900 border border-red-300',
  };
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          data-testid={`toast-${toast.tone}`}
          className={`rounded-lg px-4 py-3 text-sm shadow-lg ${toneClasses[toast.tone]}`}
        >
          <div className="flex items-start gap-3">
            <span className="flex-1">{toast.text}</span>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="opacity-70 hover:opacity-100 text-xs font-semibold"
              aria-label={t('quote.dismiss')}
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function LineItemsCard({
  version,
  tripVersion,
}: {
  version: QuoteVersion;
  tripVersion: TripVersion | null;
}) {
  const { t } = useLanguage();
  const grouped = useMemo(() => groupByDay(version.line_items), [version.line_items]);
  const dayKeys = Array.from(grouped.keys());
  const currency = version.total_snapshot.currency;

  // Quote line items reference the bound trip plan by day_index. To show the
  // user-friendly "Day N" label we convert via the trip plan's date for that
  // index, then offset against the trip's start_date.
  const planDates = tripVersion?.plan ?? null;
  const startDate = tripVersion?.start_date ?? null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-5">{t('quote.whats_included')}</h2>
      {dayKeys.length === 0 ? (
        <p className="text-sm text-gray-500">{t('quote.no_line_items')}</p>
      ) : (
        <div className="space-y-6">
          {dayKeys.map((dayIndex) => {
            const planDay = planDates?.[dayIndex];
            const dayNumber = planDay ? tripDayNumber(planDay.date, startDate) : null;
            const dayBadgeText = dayNumber ?? dayIndex + 1;
            return (
              <div key={dayIndex}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-semibold text-[#1E3D2F] bg-green-50 px-2 py-0.5 rounded">
                    {t('quote.day')} {dayBadgeText}
                  </span>
                </div>
                <div className="space-y-2">
                  {grouped.get(dayIndex)?.map((item, idx) => {
                    const lineCurrency = item.currency || currency;
                    const qty = item.quantity ?? 1;
                    return (
                      <div
                        key={`${dayIndex}-${idx}`}
                        className="flex items-start justify-between gap-4 py-2 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {item.label}
                            {qty > 1 ? (
                              <span className="ml-2 text-xs text-gray-400">×{qty}</span>
                            ) : null}
                          </p>
                          {item.notes ? (
                            <p className="text-xs text-gray-500 mt-0.5">{item.notes}</p>
                          ) : null}
                        </div>
                        <div className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                          {formatCurrency(item.amount, lineCurrency)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StayCreditPanel({
  quoteId,
  currentVersion,
  status,
  onApplied,
  onError,
}: {
  quoteId: number;
  currentVersion: QuoteVersion;
  status: QuoteStatus;
  onApplied: (bundle: QuoteWithVersion) => void;
  onError: (msg: string) => void;
}) {
  const { t } = useLanguage();
  const [eligible, setEligible] = useState<EligibleCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyCreditId, setBusyCreditId] = useState<number | null>(null);

  // Once a quote is PAID / REJECTED / EXPIRED there's no point letting the
  // user tinker — the credit is either consumed or the offer is gone.
  // We still mount the panel so a paid quote can show "Applied: $X" but
  // hide the toggle buttons via this flag.
  const isLocked = status !== 'SENT' && status !== 'DRAFT';

  // Single-credit cap today — show only the currently-applied one when
  // present, otherwise show the full eligible list.
  const appliedIds = currentVersion.applied_stay_credit_ids ?? [];
  const appliedId = appliedIds[0] ?? null;

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await apiClient.listEligibleCreditsForQuote(quoteId);
      setEligible(rows);
    } catch (err) {
      onError(err instanceof Error ? err.message : t('quote.error_load_credits'));
    } finally {
      setLoading(false);
    }
  }, [quoteId, onError, t]);

  useEffect(() => {
    if (isLocked && !appliedId) return;
    refresh();
  }, [refresh, isLocked, appliedId]);

  const handleApply = async (creditId: number) => {
    setBusyCreditId(creditId);
    try {
      const bundle = await apiClient.applyQuoteCredit(quoteId, creditId);
      onApplied(bundle);
      await refresh();
    } catch (err) {
      onError(err instanceof Error ? err.message : t('quote.error_apply_credit'));
    } finally {
      setBusyCreditId(null);
    }
  };

  const handleRemove = async (creditId: number) => {
    setBusyCreditId(creditId);
    try {
      const bundle = await apiClient.removeQuoteCredit(quoteId, creditId);
      onApplied(bundle);
      await refresh();
    } catch (err) {
      onError(err instanceof Error ? err.message : t('quote.error_remove_credit'));
    } finally {
      setBusyCreditId(null);
    }
  };

  // Find the applied credit row from the eligible list — eligibility
  // includes the currently-applied credit so we can render it as the
  // "Remove" target.
  const appliedRow = appliedId ? (eligible.find((c) => c.id === appliedId) ?? null) : null;

  // The amount ACTUALLY applied comes from the snapshot's stay-credit
  // discount line (clamped to the amount owed — SMA-237); the credit's
  // face value (its remaining balance in quote currency) comes from the
  // eligibility row. When they diverge we show both.
  const snapCurrency = currentVersion.total_snapshot.currency;
  const appliedAmount = appliedId ? appliedStayCreditAmount(currentVersion.total_snapshot) : null;
  const faceAmount = appliedRow?.converted_amount ?? null;
  const showBoth =
    appliedAmount !== null && faceAmount !== null && Number(faceAmount) !== Number(appliedAmount);

  if (isLocked && !appliedId) {
    return null;
  }

  return (
    <div data-testid="stay-credit-panel" className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-1">{t('quote.stay_credits')}</h2>
      <p className="text-xs text-gray-500 mb-4">{t('quote.stay_credits_hint')}</p>

      {loading ? (
        <div className="text-sm text-gray-500">{t('quote.loading_credits')}</div>
      ) : appliedId ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-emerald-800" data-testid="applied-credit">
                {showBoth && appliedAmount !== null && faceAmount !== null
                  ? t('quote.applied_partial')
                      .replace('{face}', formatCurrency(faceAmount, snapCurrency))
                      .replace('{applied}', formatCurrency(appliedAmount, snapCurrency))
                  : `${t('quote.applied')}${
                      appliedAmount !== null
                        ? `: ${formatCurrency(appliedAmount, snapCurrency)}`
                        : ''
                    }`}
              </p>
              {appliedRow ? (
                <p className="text-[11px] uppercase tracking-[2px] text-emerald-700/80">
                  {appliedRow.source}
                </p>
              ) : null}
            </div>
            {!isLocked && (
              <button
                type="button"
                onClick={() => handleRemove(appliedId)}
                disabled={busyCreditId === appliedId}
                className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 underline disabled:opacity-50"
              >
                {busyCreditId === appliedId ? t('quote.removing') : t('quote.remove')}
              </button>
            )}
          </div>
        </div>
      ) : eligible.length === 0 ? (
        <div className="text-sm text-gray-500">{t('quote.no_credits')}</div>
      ) : (
        <div className="space-y-2">
          {eligible.map((credit) => {
            const isBusy = busyCreditId === credit.id;
            return (
              <div
                key={credit.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3 hover:border-gray-200"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(credit.converted_amount, credit.converted_currency)}
                  </p>
                  <p className="text-[11px] uppercase tracking-[2px] text-gray-500">
                    {credit.source}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleApply(credit.id)}
                  disabled={isBusy}
                  className="text-xs font-semibold text-[#1E3D2F] hover:text-[#163024] underline disabled:opacity-50"
                >
                  {isBusy ? t('quote.applying') : t('quote.apply')}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TotalsCard({ version }: { version: QuoteVersion }) {
  const { t } = useLanguage();
  const snap = version.total_snapshot;
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-5">{t('quote.total')}</h2>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>{t('quote.subtotal')}</span>
          <span>{formatCurrency(snap.subtotal, snap.currency)}</span>
        </div>
        {snap.fees.length > 0 && (
          <div className="space-y-1">
            {snap.fees.map((fee, idx) => (
              <div key={`fee-${idx}`} className="flex justify-between text-gray-600">
                <span>{fee.label}</span>
                <span>+{formatCurrency(fee.amount, snap.currency)}</span>
              </div>
            ))}
          </div>
        )}
        {snap.discounts.length > 0 && (
          <div className="space-y-1">
            {snap.discounts.map((discount, idx) => (
              <div key={`discount-${idx}`} className="flex justify-between text-emerald-700">
                <span>{discount.label}</span>
                <span>−{formatCurrency(discount.amount, snap.currency)}</span>
              </div>
            ))}
          </div>
        )}
        <div className="border-t border-gray-200 pt-3 mt-3 flex justify-between text-base font-bold text-gray-900">
          <span>{t('quote.total')}</span>
          <span>{formatCurrency(snap.total, snap.currency)}</span>
        </div>
      </div>
    </div>
  );
}

export default function QuoteDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-6 mt-8 space-y-4 animate-pulse">
            <div className="h-56 bg-gray-200 rounded-2xl" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-72 bg-gray-200 rounded-xl" />
              <div className="h-56 bg-gray-200 rounded-xl" />
            </div>
          </div>
        </div>
      }
    >
      <QuoteDetailContent />
    </Suspense>
  );
}

function QuoteDetailContent() {
  const { t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status: sessionStatus } = useSession();
  const [bundle, setBundle] = useState<QuoteWithVersion | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [tripVersion, setTripVersion] = useState<TripVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const toastIdRef = useRef(0);

  const dismissToast = useCallback((toastId: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  }, []);

  const pushToast = useCallback(
    (text: string, tone: ToastTone = 'info', autoDismissMs = 5000) => {
      toastIdRef.current += 1;
      const id = toastIdRef.current;
      setToasts((prev) => [...prev, { id, text, tone }]);
      if (autoDismissMs > 0) {
        setTimeout(() => dismissToast(id), autoDismissMs);
      }
    },
    [dismissToast],
  );

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/sign-in');
      return;
    }
    if (sessionStatus !== 'authenticated' || !id) return;

    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiClient.getQuote(Number(id));
        if (cancelled) return;
        setBundle(data);
        try {
          const [tripBundle, v] = await Promise.all([
            apiClient.getTripById(data.quote.trip_id),
            apiClient.getCurrentTripVersion(data.quote.trip_id),
          ]);
          if (!cancelled) {
            setTrip(tripBundle.trip);
            setTripVersion(v);
          }
        } catch {
          // The quote page renders even if the trip context fetch fails —
          // line items + totals are self-contained.
        }
      } catch {
        if (!cancelled) setError(t('quote.error_not_found'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id, sessionStatus, router, t]);

  // Cancel handling: ?cancelled=1 → toast + strip query string. No state change.
  useEffect(() => {
    if (searchParams.get('cancelled') !== '1') return;
    pushToast(t('quote.toast_cancelled'), 'info');
    router.replace(`/quotes/${id}`);
  }, [searchParams, router, id, pushToast, t]);

  // Return-URL polling: ?paid=1 → poll /api/quotes/{id} every 2s up to 15
  // attempts. Stop when the quote flips to PAID; warn (non-blocking) on
  // timeout. Tear down on unmount via AbortController.
  useEffect(() => {
    if (sessionStatus !== 'authenticated' || !id) return;
    if (searchParams.get('paid') !== '1') return;
    if (bundle?.quote.status === 'PAID') {
      // Already settled — clear the query so refreshes don't re-trigger polling.
      router.replace(`/quotes/${id}`);
      return;
    }

    const controller = new AbortController();
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;
    setConfirmingPayment(true);

    const poll = async () => {
      if (controller.signal.aborted) return;
      attempts += 1;
      try {
        const data = await apiClient.getQuote(Number(id));
        if (controller.signal.aborted) return;
        if (data.quote.status === 'PAID') {
          setBundle(data);
          setConfirmingPayment(false);
          router.replace(`/quotes/${id}`);
          return;
        }
        setBundle(data);
      } catch {
        // Transient fetch errors don't break the polling loop — we keep
        // trying until success or attempt cap.
      }
      if (attempts >= POLL_MAX_ATTEMPTS) {
        if (!controller.signal.aborted) {
          setConfirmingPayment(false);
          pushToast(t('quote.toast_timeout'), 'warning', 8000);
        }
        return;
      }
      timer = setTimeout(poll, POLL_INTERVAL_MS);
    };

    timer = setTimeout(poll, POLL_INTERVAL_MS);

    return () => {
      controller.abort();
      if (timer) clearTimeout(timer);
      setConfirmingPayment(false);
    };
    // We intentionally watch only the relevant trigger: the ?paid query
    // and the loaded quote status. Re-running this effect on every bundle
    // refresh would cancel itself on each tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, sessionStatus, id]);

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 mt-8 space-y-4 animate-pulse">
          <div className="h-56 bg-gray-200 rounded-2xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-72 bg-gray-200 rounded-xl" />
            <div className="h-56 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !bundle) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 mt-8 text-center py-20 text-gray-500">
          <p>{error ?? t('quote.error_not_found')}</p>
          <Link
            href="/my-page"
            className="mt-4 inline-block text-[#1E3D2F] hover:underline text-sm"
          >
            {t('quote.back_to_my_trips')}
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const { quote, current_version: currentVersion } = bundle;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 mt-8 mb-16 space-y-6">
        <Link href="/my-page" className="text-sm text-gray-500 hover:text-gray-900 inline-block">
          {t('quote.my_trips')}
        </Link>

        <HeroCard
          trip={trip}
          tripVersion={tripVersion}
          status={quote.status}
          expiresAt={quote.expires_at}
          paidAt={quote.paid_at}
        />

        {confirmingPayment && <ConfirmingBanner />}

        {quote.status === 'SENT' && currentVersion && !confirmingPayment && (
          <div className="flex justify-end">
            <PayNowButton
              quoteId={quote.id}
              zeroTotal={isZeroTotal(currentVersion.total_snapshot)}
              onError={(msg) => pushToast(msg, 'error', 6000)}
              onPaid={(b) => setBundle(b)}
            />
          </div>
        )}

        {quote.status === 'PAID' && (
          <div
            data-testid="quote-paid-indicator"
            className="rounded-xl border border-green-200 bg-green-50 px-5 py-4 flex items-center gap-3"
          >
            <span className="text-2xl" aria-hidden>
              ✓
            </span>
            <div>
              <p className="text-sm font-semibold text-green-800">{t('quote.payment_received')}</p>
              <p className="text-xs text-green-700/80">{t('quote.payment_received_body')}</p>
            </div>
          </div>
        )}

        {currentVersion ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <LineItemsCard version={currentVersion} tripVersion={tripVersion} />
            </div>
            <div className="space-y-6">
              <StayCreditPanel
                quoteId={quote.id}
                currentVersion={currentVersion}
                status={quote.status}
                onApplied={(b) => setBundle(b)}
                onError={(msg) => pushToast(msg, 'error', 6000)}
              />
              <TotalsCard version={currentVersion} />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-sm text-gray-500">
            {t('quote.no_snapshot')}
          </div>
        )}
      </div>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      <Footer />
    </div>
  );
}
