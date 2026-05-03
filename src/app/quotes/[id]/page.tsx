'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import TopBar from '@/components/TopBar';
import Footer from '@/components/Footer';
import { apiClient } from '@/lib/api-client';
import type { QuoteLineItem, QuoteStatus, QuoteWithVersion, QuoteVersion } from '@/types/quote';
import type { Trip, TripVersion } from '@/types/trip';

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

const STATUS_LABELS: Record<QuoteStatus, string> = {
  DRAFT: 'Draft',
  SENT: 'Awaiting your decision',
  PAID: 'Paid',
  REJECTED: 'Declined',
  EXPIRED: 'Expired',
};

const STATUS_BADGE_CLASSES: Record<QuoteStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  SENT: 'bg-amber-100 text-amber-700',
  PAID: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-gray-200 text-gray-500',
};

function formatCurrency(amount: string | number, currency: string): string {
  const value = typeof amount === 'string' ? Number(amount) : amount;
  if (Number.isNaN(value)) return `${currency} ${amount}`;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString('en-US', {
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
  return (
    <span
      className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_BADGE_CLASSES[status]}`}
    >
      {STATUS_LABELS[status] ?? status}
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
  const title = tripVersion?.title?.trim() || 'Your Trip';
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
          <p className="text-sm uppercase tracking-widest text-white/60">Quote</p>
          <StatusBadge status={status} />
        </div>
        <h1 className="text-2xl md:text-4xl font-bold mb-4 break-words">{title}</h1>
        <div className="flex flex-wrap gap-4 md:gap-8 text-sm">
          <div>
            <p className="text-white/50">Dates</p>
            <p className="font-semibold">
              {formatDate(startDate)} – {formatDate(endDate)}
            </p>
          </div>
          {showExpiry && (
            <div>
              <p className="text-white/50">Valid until</p>
              <p className="font-semibold">{formatDate(expiresAt)}</p>
            </div>
          )}
          {showPaid && (
            <div>
              <p className="text-white/50">Paid on</p>
              <p className="font-semibold">{formatDate(paidAt)}</p>
            </div>
          )}
          {trip?.id !== undefined && (
            <div>
              <p className="text-white/50">Trip</p>
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

function PayNowButton({ quoteId, onError }: { quoteId: number; onError: (msg: string) => void }) {
  const [submitting, setSubmitting] = useState(false);

  const handleClick = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const result = await apiClient.createCheckoutSession(quoteId);
      // Hand off to Flywire's hosted checkout (or our /checkout/flywire wrapper).
      window.location.assign(result.checkout_url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to start checkout';
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
          <span>Starting checkout…</span>
        </>
      ) : (
        <span>Pay now</span>
      )}
    </button>
  );
}

function ConfirmingBanner() {
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
        <p className="text-sm font-semibold text-amber-800">Confirming payment…</p>
        <p className="text-xs text-amber-700/80">
          We&apos;re finalising your payment with the provider. This usually takes a few seconds.
        </p>
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
      {toasts.map((t) => (
        <div
          key={t.id}
          data-testid={`toast-${t.tone}`}
          className={`rounded-lg px-4 py-3 text-sm shadow-lg ${toneClasses[t.tone]}`}
        >
          <div className="flex items-start gap-3">
            <span className="flex-1">{t.text}</span>
            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              className="opacity-70 hover:opacity-100 text-xs font-semibold"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function LineItemsCard({ version }: { version: QuoteVersion }) {
  const grouped = useMemo(() => groupByDay(version.line_items), [version.line_items]);
  const dayKeys = Array.from(grouped.keys());
  const currency = version.total_snapshot.currency;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-5">What&apos;s included</h2>
      {dayKeys.length === 0 ? (
        <p className="text-sm text-gray-500">No line items in this quote yet.</p>
      ) : (
        <div className="space-y-6">
          {dayKeys.map((dayIndex) => (
            <div key={dayIndex}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-semibold text-[#1E3D2F] bg-green-50 px-2 py-0.5 rounded">
                  Day {dayIndex + 1}
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
          ))}
        </div>
      )}
    </div>
  );
}

function TotalsCard({ version }: { version: QuoteVersion }) {
  const snap = version.total_snapshot;
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-5">Total</h2>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
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
          <span>Total</span>
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
          <TopBar activeLink="My Page" />
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
          const [t, v] = await Promise.all([
            apiClient.getTripById(data.quote.trip_id),
            apiClient.getCurrentTripVersion(data.quote.trip_id),
          ]);
          if (!cancelled) {
            setTrip(t);
            setTripVersion(v);
          }
        } catch {
          // The quote page renders even if the trip context fetch fails —
          // line items + totals are self-contained.
        }
      } catch {
        if (!cancelled) setError('Quote not found.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id, sessionStatus, router]);

  // Cancel handling: ?cancelled=1 → toast + strip query string. No state change.
  useEffect(() => {
    if (searchParams.get('cancelled') !== '1') return;
    pushToast('Payment cancelled. You can try again whenever you’re ready.', 'info');
    router.replace(`/quotes/${id}`);
  }, [searchParams, router, id, pushToast]);

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
          pushToast(
            'Payment confirmation is taking longer than expected — refresh in a minute.',
            'warning',
            8000,
          );
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
        <TopBar activeLink="My Page" />
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
        <TopBar activeLink="My Page" />
        <div className="max-w-7xl mx-auto px-6 mt-8 text-center py-20 text-gray-500">
          <p>{error ?? 'Quote not found.'}</p>
          <Link
            href="/my-page"
            className="mt-4 inline-block text-[#1E3D2F] hover:underline text-sm"
          >
            ← Back to My Trips
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const { quote, current_version: currentVersion } = bundle;

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar activeLink="My Page" />

      <div className="max-w-7xl mx-auto px-6 mt-8 mb-16 space-y-6">
        <Link href="/my-page" className="text-sm text-gray-500 hover:text-gray-900 inline-block">
          ← My Trips
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
            <PayNowButton quoteId={quote.id} onError={(msg) => pushToast(msg, 'error', 6000)} />
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
              <p className="text-sm font-semibold text-green-800">Payment received</p>
              <p className="text-xs text-green-700/80">
                Thank you — your travel concierge will follow up shortly.
              </p>
            </div>
          </div>
        )}

        {currentVersion ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <LineItemsCard version={currentVersion} />
            </div>
            <div className="space-y-6">
              <TotalsCard version={currentVersion} />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-sm text-gray-500">
            This quote does not have a pricing snapshot yet.
          </div>
        )}
      </div>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      <Footer />
    </div>
  );
}
