'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import TopBar from '@/components/TopBar';
import Footer from '@/components/Footer';
import { apiClient } from '@/lib/api-client';
import type { QuoteLineItem, QuoteStatus, QuoteWithVersion, QuoteVersion } from '@/types/quote';
import type { Trip, TripVersion } from '@/types/trip';

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
}: {
  trip: Trip | null;
  tripVersion: TripVersion | null;
  status: QuoteStatus;
  expiresAt?: string | null;
}) {
  const title = tripVersion?.title?.trim() || 'Your Trip';
  const startDate = tripVersion?.start_date || undefined;
  const endDate = tripVersion?.end_date || undefined;
  const showExpiry = status === 'SENT' && !!expiresAt;

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
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const [bundle, setBundle] = useState<QuoteWithVersion | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [tripVersion, setTripVersion] = useState<TripVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        />

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

      <Footer />
    </div>
  );
}
