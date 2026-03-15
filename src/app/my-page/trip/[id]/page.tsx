'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import TopBar from '@/components/TopBar';
import SubNav from '@/components/SubNav';
import Footer from '@/components/Footer';
import { apiClient } from '@/lib/api-client';
import type { TripDetail, TravelPlanItem, CommentContent } from '@/types/trip';
import Image from 'next/image';
import { getImageUrl } from '@/types/hotel';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  draft: 'Planning',
  'waiting-for-proposal': 'Awaiting Proposal',
  'in-progress': 'In Progress',
  'waiting-for-payment': 'Awaiting Payment',
  paid: 'Payment Confirmed',
  'ready-to-travel': 'Ready to Travel',
  'traveling-now': 'Traveling Now',
  'travel-completed': 'Completed',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  'waiting-for-proposal': 'bg-yellow-100 text-yellow-700',
  'in-progress': 'bg-blue-100 text-blue-700',
  'waiting-for-payment': 'bg-orange-100 text-orange-700',
  paid: 'bg-teal-100 text-teal-700',
  'ready-to-travel': 'bg-green-100 text-green-700',
  'traveling-now': 'bg-emerald-100 text-emerald-700',
  'travel-completed': 'bg-gray-100 text-gray-700',
};

const categoryColor: Record<string, string> = {
  flight: 'bg-blue-100 text-blue-700',
  staying: 'bg-purple-100 text-purple-700',
  activities: 'bg-green-100 text-green-700',
  others: 'bg-gray-100 text-gray-600',
};

const categoryLabel: Record<string, string> = {
  flight: 'Flight',
  staying: 'Hotel',
  activities: 'Activity',
  others: 'Other',
};

// ─── Utilities ───────────────────────────────────────────────────────────────

function getNights(startDate?: string, endDate?: string): number | null {
  if (!startDate || !endDate) return null;
  const diff = new Date(endDate).getTime() - new Date(startDate).getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '\u2014';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDayDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function getDestination(trip: TripDetail): string {
  return trip.preset_destination_cities_names || trip.custom_destination_cities || 'Your Trip';
}

// ─── Cost Row ────────────────────────────────────────────────────────────────

function CostRow({ label, value }: { label: string; value?: number }) {
  if (!value) return null;
  return (
    <div className="flex justify-between text-sm py-2 border-b border-gray-100 last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">${value.toLocaleString()}</span>
    </div>
  );
}

// ─── Hero Card ───────────────────────────────────────────────────────────────

function HeroCard({ trip }: { trip: TripDetail }) {
  const destination = getDestination(trip);
  const nights = getNights(trip.start_date, trip.end_date);
  const statusLabel = STATUS_LABELS[trip.status] ?? trip.status;
  const statusColor = STATUS_COLORS[trip.status] ?? 'bg-gray-100 text-gray-600';

  return (
    <div className="bg-[#1E3D2F] rounded-2xl overflow-hidden flex">
      <div className="w-[480px] flex-shrink-0 relative">
        {trip.cover_image ? (
          <Image
            src={getImageUrl(trip.cover_image)}
            alt={destination}
            className="object-cover"
            fill
            sizes="480px"
          />
        ) : (
          <div className="w-full h-full min-h-[240px] bg-gradient-to-br from-[#2a5240] to-[#C4956A] flex items-center justify-center">
            <span className="text-white text-2xl font-bold px-6 text-center">{destination}</span>
          </div>
        )}
      </div>
      <div className="flex-1 p-10 text-white flex flex-col justify-center">
        <div className="flex items-center gap-3 mb-2">
          <p className="text-sm uppercase tracking-widest text-white/60">Trip Details</p>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColor}`}>
            {statusLabel}
          </span>
        </div>
        <h1 className="text-4xl font-bold mb-4">{destination}</h1>
        <div className="flex flex-wrap gap-8 text-sm">
          <div>
            <p className="text-white/50">Dates</p>
            <p className="font-semibold">
              {formatDate(trip.start_date)} – {formatDate(trip.end_date)}
            </p>
          </div>
          {nights !== null && (
            <div>
              <p className="text-white/50">Duration</p>
              <p className="font-semibold">
                {nights} {nights === 1 ? 'Night' : 'Nights'}
              </p>
            </div>
          )}
          <div>
            <p className="text-white/50">Travelers</p>
            <p className="font-semibold">
              {trip.adults} {trip.adults === 1 ? 'Adult' : 'Adults'}
              {trip.kids ? `, ${trip.kids} ${trip.kids === 1 ? 'Kid' : 'Kids'}` : ''}
            </p>
          </div>
          {trip.purpose && (
            <div>
              <p className="text-white/50">Purpose</p>
              <p className="font-semibold capitalize">{trip.purpose}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Info Cards ──────────────────────────────────────────────────────────────

function InfoCards({ trip, allItems }: { trip: TripDetail; allItems: TravelPlanItem[] }) {
  const statusLabel = STATUS_LABELS[trip.status] ?? trip.status;
  const firstFlight = allItems.find((i) => i.category_type === 'flight');
  const firstHotel = allItems.find((i) => i.category_type === 'staying');
  const activitiesCount = allItems.filter((i) => i.category_type === 'activities').length;

  return (
    <div className="grid grid-cols-4 gap-5">
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="text-2xl mb-3">✈️</div>
        <h3 className="font-semibold text-gray-900">Flight</h3>
        {firstFlight ? (
          <>
            <p className="text-sm text-gray-600 mt-1">{firstFlight.category_name}</p>
            {firstFlight.city && <p className="text-xs text-gray-400 mt-1">{firstFlight.city}</p>}
          </>
        ) : (
          <p className="text-sm text-gray-400 mt-1">Not yet scheduled</p>
        )}
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="text-2xl mb-3">🏨</div>
        <h3 className="font-semibold text-gray-900">Hotel</h3>
        {firstHotel ? (
          <>
            <p className="text-sm text-gray-600 mt-1">{firstHotel.category_name}</p>
            {firstHotel.city && <p className="text-xs text-gray-400 mt-1">{firstHotel.city}</p>}
          </>
        ) : (
          <p className="text-sm text-gray-400 mt-1">Not yet assigned</p>
        )}
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="text-2xl mb-3">🎯</div>
        <h3 className="font-semibold text-gray-900">Activities</h3>
        <p className="text-sm text-gray-600 mt-1">
          {activitiesCount} {activitiesCount === 1 ? 'Activity' : 'Activities'} Planned
        </p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="text-2xl mb-3">📋</div>
        <h3 className="font-semibold text-gray-900">Booking</h3>
        <p className="text-sm text-gray-600 mt-1">{statusLabel}</p>
        <p className="text-xs text-gray-400 mt-1">Ref: TIP-{trip.id}</p>
      </div>
    </div>
  );
}

// ─── Proposal Section ────────────────────────────────────────────────────────

function ProposalSection({ trip }: { trip: TripDetail }) {
  if (!trip.proposal) return null;
  const p = trip.proposal;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Cost Breakdown</h2>
      <CostRow label="Flights" value={p.flight_cost} />
      <CostRow label="Accommodation" value={p.staying_cost} />
      <CostRow label="Activities" value={p.activity_cost} />
      <CostRow label="Other" value={p.other_cost} />
      {p.coupon_cost != null && p.coupon_cost > 0 && (
        <div className="flex justify-between text-sm py-2 border-b border-gray-100">
          <span className="text-green-600">Coupon</span>
          <span className="font-medium text-green-600">-${p.coupon_cost.toLocaleString()}</span>
        </div>
      )}
      {p.total_cost != null && (
        <div className="flex justify-between text-sm pt-3 mt-1">
          <span className="font-semibold text-gray-900">Total</span>
          <span className="font-bold text-[#1E3D2F]">${p.total_cost.toLocaleString()}</span>
        </div>
      )}
      {trip.paid_amount != null && trip.paid_amount > 0 && (
        <div className="flex justify-between text-sm pt-2">
          <span className="text-gray-500">Paid</span>
          <span className="font-medium text-green-600">${trip.paid_amount.toLocaleString()}</span>
        </div>
      )}
      {trip.pending_amount != null && trip.pending_amount > 0 && (
        <div className="flex justify-between text-sm pt-2">
          <span className="text-gray-500">Remaining</span>
          <span className="font-medium text-orange-600">
            ${trip.pending_amount.toLocaleString()}
          </span>
        </div>
      )}
      {trip.proposal.note && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-500 font-medium mb-1">Note from concierge</p>
          <p className="text-sm text-gray-700">{trip.proposal.note}</p>
        </div>
      )}
    </div>
  );
}

// ─── Itinerary Timeline ──────────────────────────────────────────────────────

function ItineraryTimeline({ trip }: { trip: TripDetail }) {
  const sortedPlans = [...(trip.travel_plans ?? [])].sort((a, b) => a.sort - b.sort);
  if (sortedPlans.length === 0) return null;

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-5">Itinerary</h2>
      <div className="space-y-4">
        {sortedPlans.map((plan, i) => (
          <div key={plan.id} className="flex gap-5 items-start">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-[#1E3D2F] text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                {plan.sort ?? i + 1}
              </div>
              {i < sortedPlans.length - 1 && (
                <div className="w-px flex-1 bg-gray-200 mt-1 min-h-[24px]" />
              )}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5 flex-1 mb-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-semibold text-[#1E3D2F] bg-green-50 px-2 py-0.5 rounded">
                  Day {plan.sort ?? i + 1}
                </span>
                <span className="text-xs text-gray-400">{formatDayDate(plan.date)}</span>
                {plan.day_topic && (
                  <span className="text-xs font-medium text-gray-700">{plan.day_topic}</span>
                )}
              </div>
              {plan.items.length > 0 ? (
                <div className="space-y-2">
                  {plan.items.map((item: TravelPlanItem) => (
                    <div key={item.id} className="flex items-start gap-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-medium flex-shrink-0 mt-0.5 ${
                          categoryColor[item.category_type ?? 'others'] ??
                          'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {categoryLabel[item.category_type ?? 'others'] ?? 'Other'}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.category_name}
                        </p>
                        {item.city && <p className="text-xs text-gray-400">{item.city}</p>}
                      </div>
                      {item.estimated_cost != null && (
                        <span className="ml-auto text-xs text-gray-500 flex-shrink-0">
                          ${item.estimated_cost.toLocaleString()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No items for this day.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Comments Section ────────────────────────────────────────────────────────

function CommentsSection({ trip, onRefresh }: { trip: TripDetail; onRefresh: () => void }) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const comments = trip.comments?.content ?? [];

  useEffect(() => {
    if (trip.comments && trip.comments.user_unread_count > 0) {
      apiClient.markCommentRead(trip.id).catch(() => {});
    }
  }, [trip.id, trip.comments]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments.length]);

  const handleSend = async () => {
    const text = message.trim();
    if (!text || sending) return;

    setSending(true);
    try {
      const content: CommentContent[] = [{ role: 'user', type: 'text', message: text }];
      await apiClient.addComment(trip.id, content);
      setMessage('');
      onRefresh();
    } catch {
      // keep message in input on error
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Messages</h2>

      {/* Thread */}
      <div className="max-h-80 overflow-y-auto space-y-3 mb-4">
        {comments.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">
            No messages yet. Send a message to your concierge team.
          </p>
        )}
        {comments.map((c, i) => (
          <div key={i} className={`flex ${c.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[75%] rounded-xl px-4 py-2.5 text-sm ${
                c.role === 'user' ? 'bg-[#1E3D2F] text-white' : 'bg-gray-100 text-gray-900'
              }`}
            >
              {c.type === 'file' && c.filePath ? (
                <a
                  href={c.filePath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  {c.message || 'Attachment'}
                </a>
              ) : (
                <p className="whitespace-pre-wrap">{c.message}</p>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-3">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Type a message..."
          className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3D2F]/20 focus:border-[#1E3D2F]"
        />
        <button
          onClick={handleSend}
          disabled={!message.trim() || sending}
          className="px-5 py-2.5 bg-[#1E3D2F] text-white text-sm font-medium rounded-lg hover:bg-[#2a5240] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}

// ─── Agree Proposal Button ───────────────────────────────────────────────────

function AgreeButton({ tripId, onRefresh }: { tripId: number; onRefresh: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAgree = async () => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.agreeProposal(tripId);
      setConfirming(false);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept proposal');
    } finally {
      setLoading(false);
    }
  };

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="w-full py-3 bg-[#1E3D2F] text-white text-sm font-semibold rounded-xl hover:bg-[#2a5240] transition-colors"
      >
        Accept Proposal
      </button>
    );
  }

  return (
    <div className="bg-white rounded-xl border-2 border-[#1E3D2F] p-6">
      <h3 className="font-semibold text-gray-900 mb-2">Confirm Acceptance</h3>
      <p className="text-sm text-gray-500 mb-4">
        By accepting this proposal, you agree to the itinerary and pricing. You&apos;ll proceed to
        payment next.
      </p>
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      <div className="flex gap-3">
        <button
          onClick={handleAgree}
          disabled={loading}
          className="flex-1 py-2.5 bg-[#1E3D2F] text-white text-sm font-semibold rounded-lg hover:bg-[#2a5240] transition-colors disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Yes, Accept'}
        </button>
        <button
          onClick={() => {
            setConfirming(false);
            setError(null);
          }}
          disabled={loading}
          className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Payment Section ─────────────────────────────────────────────────────────

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'sb';

function PaymentSection({ trip, onRefresh }: { trip: TripDetail; onRefresh: () => void }) {
  const [payError, setPayError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const amount =
    trip.pending_amount && trip.pending_amount > 0
      ? trip.pending_amount
      : (trip.proposal?.total_cost ?? 0);

  return (
    <div className="bg-orange-50 rounded-xl border border-orange-200 p-6">
      <h3 className="font-semibold text-orange-800 mb-2">Payment Required</h3>
      <p className="text-sm text-orange-700 mb-1">
        Your proposal has been accepted. Complete payment to confirm your booking.
      </p>
      {trip.paid_amount != null && trip.paid_amount > 0 && (
        <p className="text-sm text-green-700 mb-1">
          Already paid: ${trip.paid_amount.toLocaleString()}
        </p>
      )}
      {amount > 0 && (
        <p className="text-2xl font-bold text-orange-800 mb-4">${amount.toLocaleString()}</p>
      )}

      {payError && <p className="text-sm text-red-600 mb-3">{payError}</p>}

      {processing && <p className="text-sm text-orange-700 mb-3">Verifying payment...</p>}

      <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, currency: 'USD' }}>
        <PayPalButtons
          style={{ layout: 'vertical', shape: 'rect', label: 'pay' }}
          createOrder={async () => {
            setPayError(null);
            try {
              const res = await apiClient.createPayment(trip.id, amount);
              return res.paypal_order_id;
            } catch (err) {
              setPayError(err instanceof Error ? err.message : 'Failed to create payment');
              throw err;
            }
          }}
          onApprove={async (data) => {
            setProcessing(true);
            setPayError(null);
            try {
              await apiClient.verifyPayment(trip.id, data.orderID);
              onRefresh();
            } catch (err) {
              setPayError(err instanceof Error ? err.message : 'Payment verification failed');
            } finally {
              setProcessing(false);
            }
          }}
          onError={(err) => {
            setPayError(typeof err === 'string' ? err : 'Payment failed. Please try again.');
          }}
          onCancel={() => {
            setPayError('Payment was cancelled.');
          }}
        />
      </PayPalScriptProvider>
    </div>
  );
}

// ─── Booking Documents ───────────────────────────────────────────────────────

function BookingDocuments({ trip }: { trip: TripDetail }) {
  if (!trip.tickets || trip.tickets.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-3">Booking Documents</h2>
      <div className="space-y-2">
        {trip.tickets.map((ticket, i) => (
          <a
            key={i}
            href={ticket.file}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-[#1E3D2F] hover:underline"
          >
            <span>📄</span>
            <span className="truncate">{ticket.fileName || `Document ${i + 1}`}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

// ─── Pending Info Card ───────────────────────────────────────────────────────

function PendingInfoCard({ trip }: { trip: TripDetail; onRefresh: () => void }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between gap-6">
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">What happens next?</h3>
          <p className="text-sm text-gray-500">
            {trip.status === 'draft'
              ? 'Your trip details are ready. Submit it to our concierge team, or continue refining with the AI concierge.'
              : "Our concierge team is crafting your personalized travel proposal. You'll receive a notification once your proposal is ready to review."}
          </p>
        </div>
        {trip.status === 'draft' && (
          <div className="flex flex-shrink-0 gap-3">
            <Link
              href={`/concierge?trip_id=${trip.id}`}
              className="px-5 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-full hover:bg-gray-50 transition-colors"
            >
              Edit in Concierge
            </Link>
            <Link
              href={`/concierge?trip_id=${trip.id}&action=submit`}
              className="px-6 py-2.5 bg-[#1E3D2F] text-white text-sm font-medium rounded-full hover:bg-[#2a5240] transition-colors"
            >
              Submit Trip
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrip = () => {
    if (!id) return;
    apiClient
      .getTripById(Number(id))
      .then(setTrip)
      .catch(() => setError('Failed to load trip details.'))
      .finally(() => setLoading(false));
  };

  useEffect(fetchTrip, [id]);

  const handleRefresh = () => {
    fetchTrip();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopBar activeLink="My Page" />
        <SubNav activeTab="Upcoming Travels" />
        <div className="max-w-7xl mx-auto px-6 mt-8 space-y-4 animate-pulse">
          <div className="h-56 bg-gray-200 rounded-2xl" />
          <div className="grid grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopBar activeLink="My Page" />
        <SubNav activeTab="Upcoming Travels" />
        <div className="max-w-7xl mx-auto px-6 mt-8 text-center py-20 text-gray-500">
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

  const isPending = trip.status === 'draft' || trip.status === 'waiting-for-proposal';
  const hasProposal = !!trip.proposal;
  const hasItinerary = (trip.travel_plans ?? []).length > 0;
  const allItems: TravelPlanItem[] = [...(trip.travel_plans ?? [])]
    .sort((a, b) => a.sort - b.sort)
    .flatMap((p) => p.items);
  const isCompleted = trip.status === 'travel-completed';
  const showAcceptButton = trip.status === 'in-progress' && hasProposal;
  const showPayment = trip.status === 'waiting-for-payment';

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar activeLink="My Page" />
      <SubNav activeTab="Upcoming Travels" />

      <div className="max-w-7xl mx-auto px-6 mt-8 mb-16 space-y-6">
        {/* Back link */}
        <Link href="/my-page" className="text-sm text-gray-500 hover:text-gray-900 inline-block">
          ← My Trips
        </Link>

        {/* Hero */}
        <HeroCard trip={trip} />

        {/* Pending states: draft / waiting-for-proposal */}
        {isPending && <PendingInfoCard trip={trip} onRefresh={handleRefresh} />}

        {/* Info cards + proposal + itinerary (once we have proposal data) */}
        {hasItinerary && <InfoCards trip={trip} allItems={allItems} />}

        <div className="grid grid-cols-3 gap-6">
          {/* Main column */}
          <div className="col-span-2 space-y-6">
            {hasItinerary && <ItineraryTimeline trip={trip} />}

            {/* Comments — show whenever trip has comments or has proposal */}
            {(trip.has_comments || hasProposal) && (
              <CommentsSection trip={trip} onRefresh={handleRefresh} />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Accept proposal */}
            {showAcceptButton && <AgreeButton tripId={trip.id} onRefresh={handleRefresh} />}

            {/* Payment */}
            {showPayment && <PaymentSection trip={trip} onRefresh={handleRefresh} />}

            {/* Cost breakdown */}
            {hasProposal && <ProposalSection trip={trip} />}

            {/* Booking documents */}
            <BookingDocuments trip={trip} />

            {/* Review CTA for completed trips */}
            {isCompleted && (
              <Link
                href={`/my-page/travel-history/${trip.id}/reviews`}
                className="block w-full py-3 bg-[#C4956A] text-white text-sm font-semibold rounded-xl hover:bg-[#b3845c] transition-colors text-center"
              >
                Write Reviews
              </Link>
            )}

            {/* Trip summary stats */}
            {hasItinerary && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Trip Summary</h3>
                <div className="grid grid-cols-2 gap-3">
                  {getNights(trip.start_date, trip.end_date) !== null && (
                    <div className="text-center bg-gray-50 rounded-lg p-3">
                      <p className="text-2xl font-bold text-[#1E3D2F]">
                        {getNights(trip.start_date, trip.end_date)}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">Nights</p>
                    </div>
                  )}
                  <div className="text-center bg-gray-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-[#1E3D2F]">
                      {(trip.travel_plans ?? []).length}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">Days</p>
                  </div>
                  <div className="text-center bg-gray-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-[#1E3D2F]">
                      {allItems.filter((i) => i.category_type === 'activities').length}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">Activities</p>
                  </div>
                  <div className="text-center bg-gray-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-[#1E3D2F]">
                      {trip.adults + (trip.kids ?? 0)}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">Travelers</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
